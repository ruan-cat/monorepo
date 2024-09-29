// gulpfile.js
import gulp from "gulp";
import { removeDist, buildRootStyle, buildStyle, buildComponent } from "./index.js";

const { series } = gulp;

export default series(removeDist, buildComponent, buildStyle, buildRootStyle);
