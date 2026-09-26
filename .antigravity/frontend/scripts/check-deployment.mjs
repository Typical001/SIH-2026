// Netlify must know the public backend before compiling Vite's client bundle.
const value = process.env.VITE_API_URL;
if (!value || !/^https:\/\/[^/]+$/.test(value)) {
  throw new Error('Set VITE_API_URL to the Render HTTPS origin, without a trailing slash or /api, then redeploy.');
}
