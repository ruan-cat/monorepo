import { URL, fileURLToPath } from "node:url";
import path from "node:path";

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前文件所在的目录
const __dirname = path.dirname(__filename);
// 现在你可以像以前一样使用 __dirname
console.log(__dirname);
