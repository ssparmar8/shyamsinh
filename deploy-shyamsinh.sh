#!/usr/bin/env bash
#
# Deploy the shyamsinh static site to AWS (S3 + CloudFront).
# For now it serves the same build output (out/) as v-blog; once the two
# sites diverge, give this project its own build step / source.
#
# Infrastructure (already provisioned):
#   - AWS CLI profile : v-blog   (same AWS account as v-blog)
#   - S3 bucket       : shyamsinh-site-188876037570   (private, OAC-only)
#   - CloudFront dist : E3T0Y94CNBWRSV
#   - Rewrite function: v-blog-rewrite  (shared)
#   - Live URL        : https://d39zi9n61r4f1n.cloudfront.net/
#
# Usage:
#   ./deploy-shyamsinh.sh              build (next export) + upload + invalidate
#   ./deploy-shyamsinh.sh --no-build   skip the build, just upload existing out/
#
set -euo pipefail

PROFILE=v-blog
BUCKET=shyamsinh-site-188876037570
DIST_ID=E3T0Y94CNBWRSV
URL=https://d39zi9n61r4f1n.cloudfront.net/

cd "$(dirname "$0")"

echo "==> Building static export (out/) ..."
npm run build


if [[ ! -d out ]]; then
  echo "ERROR: out/ not found. Run 'npm run build' first." >&2
  exit 1
fi

echo "==> Uploading immutable assets (_next/) ..."
aws s3 sync out/_next/ "s3://$BUCKET/_next/" \
  --cache-control 'public,max-age=31536000,immutable' \
  --profile "$PROFILE" --only-show-errors

echo "==> Uploading pages + assets (pruning stale files) ..."
aws s3 sync out/ "s3://$BUCKET/" --delete \
  --cache-control 'public,max-age=0,must-revalidate' \
  --profile "$PROFILE" --only-show-errors

# Next writes its generated metadata images — social cards AND app icons — to
# EXTENSIONLESS keys, because that is the URL it puts in the meta and <link> tags.
# `aws s3 sync` guesses Content-Type from the file extension and there isn't one, so it
# uploads them as binary/octet-stream. Facebook, LinkedIn and Slack all refuse an og:image
# that is not served with an image/* type, and they refuse it silently: the page unfurls
# with no picture and nothing anywhere reports an error. Browsers are just as quiet about
# a mistyped favicon — the tab falls back to a blank page glyph. Re-put them with the type
# spelled out. `cp` always uploads, so this also repairs objects a sync typed wrongly.
#
# favicon.ico is absent from this list on purpose: it carries an extension, so sync already
# types it correctly. Keep this in step with the metadata routes in src/app/ and with the
# passthrough in infra/shyamsinh-rewrite.js — the three go together.
echo "==> Re-uploading metadata images with an explicit Content-Type ..."
for img in opengraph-image twitter-image icon apple-icon; do
  if [[ -f "out/$img" ]]; then
    aws s3 cp "out/$img" "s3://$BUCKET/$img" \
      --content-type image/png \
      --cache-control 'public,max-age=0,must-revalidate' \
      --profile "$PROFILE" --only-show-errors
  else
    echo "WARNING: out/$img missing — the social card will not render." >&2
  fi
done

echo "==> Invalidating CloudFront cache ..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" --paths '/*' \
  --profile "$PROFILE" --query 'Invalidation.{Id:Id,Status:Status}' --output table

echo ""
echo "==> Done -> $URL"
