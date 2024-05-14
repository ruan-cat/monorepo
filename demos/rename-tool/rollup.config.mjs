// import * as tsTypes from "typescript";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import typescript2 from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

import pkg from "./package.json" assert { type: "json" };
const external = Object.keys(pkg.dependencies || "");
const globals = external.reduce((prev, current) => {
  const newPrev = prev;
  newPrev[current] = current;
  return newPrev;
}, {});

const defaultConfig = {
  input: "./src/index.mts",

  output: {
    file: "./dist/index.js",
    format: "cjs",
    banner: "#!/usr/bin/env node",
    globals,
  },

  // external,

  plugins: [
    typescript2({
      exclude: "node_modules/**",
      useTsconfigDeclarationDir: true,
      // typescript: tsTypes,
      tsconfig: "./tsconfig.json",
    }),

    json(),

    // terser(),

    resolve(),

    commonjs(),
  ],
};

export default defaultConfig;
