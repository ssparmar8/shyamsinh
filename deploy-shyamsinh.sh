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

if [[ "${1:-}" != "--no-build" ]]; then
  echo "==> Building static export (out/) ..."
  npm run build
fi

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

echo "==> Invalidating CloudFront cache ..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" --paths '/*' \
  --profile "$PROFILE" --query 'Invalidation.{Id:Id,Status:Status}' --output table

echo ""
echo "==> Done -> $URL"
