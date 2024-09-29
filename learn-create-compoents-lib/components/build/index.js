// index.js
import gulp from "gulp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import shell from "shelljs";

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), "../");

const { src, dest } = gulp;
const sass = gulpSass(dartSass);

// 删除打包产物
export const removeDist = async () => {
	shell.rm("-rf", `${componentPath}/lib`);
	shell.rm("-rf", `${componentPath}/es`);
	shell.rm("-rf", `${componentPath}/types`);
};

// 构建css
export const buildRootStyle = () => {
	return src(`${componentPath}/src/style.scss`)
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(dest(`${componentPath}/es`))
		.pipe(dest(`${componentPath}/lib`));
};

// 构建每个组件下单独的css
export const buildStyle = () => {
	return src(`${componentPath}/src/**/style/**.scss`)
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(dest(`${componentPath}/es`))
		.pipe(dest(`${componentPath}/lib`));
};

// 打包组件
export const buildComponent = async () => {
	shell.cd(componentPath);
	shell.exec("vite build");
};
