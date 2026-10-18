/**
 * cloudflare:email 是 Workers 运行时内置模块（非 npm 包），
 * @cloudflare/workers-types 未随 nitro tsconfig 引入，此处提供最小声明。
 *
 * 仅声明本项目用到的 EmailMessage（send_email binding 的 MIME 发送载体）。
 *
 * @see https://developers.cloudflare.com/email-routing/email-workers/
 */
declare module "cloudflare:email" {
	export class EmailMessage {
		constructor(from?: string, to?: string, raw?: string | ReadableStream);
	}
}
