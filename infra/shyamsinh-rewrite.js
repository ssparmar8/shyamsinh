// CloudFront Function (viewer-request) for the shyamsinh distribution, E3T0Y94CNBWRSV.
//
// Committed so the deployed rewrite is reviewable in the repo it serves. Publish with:
//   aws cloudfront describe-function --name shyamsinh-rewrite --profile v-blog   # get ETag
//   aws cloudfront update-function  --name shyamsinh-rewrite --if-match <ETag> \
//     --function-config Comment="...",Runtime=cloudfront-js-2.0 \
//     --function-code fileb://infra/shyamsinh-rewrite.js --profile v-blog
//   aws cloudfront publish-function --name shyamsinh-rewrite --if-match <ETag> --profile v-blog
//
// Forked from the shared `v-blog-rewrite` rather than editing it, so v-blog keeps running
// the code it runs today. The only difference is the passthrough below.
//
// Contract: next.config.ts sets `trailingSlash: true`, so `next build` exports every route
// as `<route>/index.html`. Do not remove that option without changing this function — the
// two are a matched pair, and the failure mode is every page but `/` returning 404, which
// is exactly the state this file was written to fix.
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Next's metadata image routes are PNG objects at EXTENSIONLESS keys — that is the URL
    // Next writes into og:image and <link rel="icon">, and it is not negotiable from the app
    // side. They must reach S3 exactly as requested; rewriting them to /index.html serves a
    // 404 to every crawler and browser, and the failure is silent: the link unfurls with no
    // card, the tab shows a blank page glyph. Matched by suffix, not exact path, so per-route
    // variants added later (e.g. /systems/aiva/opengraph-image) work without touching this.
    //
    // Keep this list in step with the metadata route files in src/app/. Anything Next serves
    // extensionlessly belongs here. /favicon.ico and /sitemap.xml do NOT — they carry a dot
    // and fall through the extension check below on their own.
    if (
        uri.endsWith('/opengraph-image') ||
        uri.endsWith('/twitter-image') ||
        uri.endsWith('/icon') ||
        uri.endsWith('/apple-icon')
    ) {
        return request;
    }

    // Directory request -> serve its index.html
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    } else if (!uri.includes('.')) {
        // Extensionless path -> treat as a directory
        request.uri = uri + '/index.html';
    }

    return request;
}
