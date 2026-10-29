from pathlib import Path
import json
import re
import subprocess
import sys


root = Path(__file__).resolve().parents[1]
errors = []


def require(condition, message):
    if not condition:
        errors.append(message)


shopping = root / "shopping.html"
products_js = root / "data/products.js"
sources_json = root / "data/product-sources.json"
product_dir = root / "assets/products"

require(shopping.exists(), "missing shopping.html")
require(products_js.exists(), "missing data/products.js")
require(sources_json.exists(), "missing data/product-sources.json")

products = []
if products_js.exists():
    text = products_js.read_text("utf-8")
    match = re.fullmatch(r"window\.ERNEST_PRODUCTS=(.*);\s*", text, re.S)
    require(match is not None, "data/products.js is not the expected catalog assignment")
    if match:
        try:
            products = json.loads(match.group(1))["products"]
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            errors.append(f"invalid product catalog: {exc}")

require(len(products) == 473, f"product count != 473 (found {len(products)})")
ids = [item.get("id") for item in products]
require(len(ids) == len(set(ids)), "product IDs are not unique")

image_refs = {item.get("image") for item in products if item.get("image")}
require(len(image_refs) == 470, f"unique product image refs != 470 (found {len(image_refs)})")

webps = list(product_dir.glob("*.webp")) if product_dir.exists() else []
require(len(webps) == 470, f"WebP file count != 470 (found {len(webps)})")
for rel in sorted(image_refs):
    image = root / rel
    require(image.exists(), f"missing product image: {rel}")
    if image.exists():
        header = image.read_bytes()[:12]
        require(header[:4] == b"RIFF" and header[8:12] == b"WEBP", f"invalid WebP header: {rel}")

if sources_json.exists():
    try:
        sources = json.loads(sources_json.read_text("utf-8"))
        require(len(sources.get("items", [])) == 473, "source item count != 473")
    except json.JSONDecodeError as exc:
        errors.append(f"invalid product-sources.json: {exc}")

if shopping.exists():
    html = shopping.read_text("utf-8")
    for rel in re.findall(r'(?:href|src)=["\']([^"\'#]+)', html, re.I):
        if re.match(r"^(?:https?:|mailto:|tel:|data:|javascript:|//)", rel, re.I):
            continue
        clean = rel.split("?")[0].lstrip("./").lstrip("/")
        require((root / clean).exists(), f"broken shopping page ref: {clean}")

index = (root / "index.html").read_text("utf-8")
require('href="shopping.html"' in index, "homepage does not link to shopping.html")

core = root / "assets/shopping-core.js"
if core.exists() and products_js.exists():
    node_test = r"""
const core = require(process.argv[2]);
const fs = require('fs');
const raw = fs.readFileSync(process.argv[3], 'utf8');
const data = JSON.parse(raw.replace(/^window\.ERNEST_PRODUCTS=/, '').replace(/;\s*$/, ''));
const dhc = core.filter(data.products, {brand: 'DHC'});
if (dhc.length !== 307) throw new Error(`DHC filter returned ${dhc.length}`);
const eye = core.filter(data.products, {kind: 'eyedrop'});
if (eye.length !== 56) throw new Error(`eyedrop filter returned ${eye.length}`);
if (!core.filter(data.products, {q: '乳酸菌'}).length) throw new Error('search returned no 乳酸菌 products');
const known = new Set(data.products.map(x => x.id));
const first = data.products[0].id;
const result = core.merge(
  {version: 1, items: {}},
  {version: 1, items: {[first]: {qty: 2, bought: true, note: '測試'}}},
  known
);
if (result.imported !== 1 || result.state.items[first].qty !== 2 || !result.state.items[first].bought) {
  throw new Error('purchase-list merge failed');
}
"""
    run = subprocess.run(
        ["node", "-", str(core), str(products_js)],
        input=node_test,
        text=True,
        capture_output=True,
    )
    require(run.returncode == 0, f"shopping behavior test failed: {run.stderr.strip()}")
else:
    errors.append("missing shopping core behavior files")

if errors:
    print("\n".join(errors))
    sys.exit(1)

print("SHOPPING QA PASS: 473 products; 470 WebP images; filters, search, purchase list, and homepage link OK")
