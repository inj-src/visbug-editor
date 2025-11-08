import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";
import postcssImport from "postcss-import";

const isProd = process.env.BUILD === "production";

const basePlugins = [
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
  postcss({
    extract: false,
    inject: false, // Don't inject - we're using adoptedStyleSheets
    minimize: isProd,
    plugins: [postcssImport()], // Process @import statements
  }),
];

const prodPlugins = isProd ? [terser()] : [];

export default [
  // ESM build (for bundlers - with external deps)
  {
    input: "src/index.js",
    output: {
      file: "dist/visbug-editor.esm.js",
      format: "es",
      sourcemap: !isProd,
    },
    plugins: [...basePlugins, ...prodPlugins],
    external: ["blingblingjs", "hotkeys-js"],
  },
  // ESM build for browsers (bundled with deps)
  {
    input: "src/index.js",
    output: {
      file: "dist/visbug-editor.browser.js",
      format: "es",
      sourcemap: !isProd,
    },
    plugins: [...basePlugins, ...prodPlugins],
    external: [], // Bundle everything for browser use
  },
  // CommonJS build
  {
    input: "src/index.js",
    output: {
      file: "dist/visbug-editor.cjs.js",
      format: "cjs",
      sourcemap: !isProd,
      exports: "named",
    },
    plugins: [...basePlugins, ...prodPlugins],
    external: ["blingblingjs", "hotkeys-js"],
  },
  // UMD build (for browsers)
  {
    input: "src/index.js",
    output: {
      file: "dist/visbug-editor.umd.js",
      format: "umd",
      name: "VisBugEditor",
      sourcemap: !isProd,
      globals: {
        blingblingjs: "blingblingjs",
        "hotkeys-js": "hotkeys",
      },
    },
    plugins: [...basePlugins, ...prodPlugins],
    external: ["blingblingjs", "hotkeys-js"],
  },
];
