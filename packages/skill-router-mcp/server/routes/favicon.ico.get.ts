import { defineHandler, redirect } from "nitro/h3";

/** Browser fallback for clients that request the conventional /favicon.ico path. */
export default defineHandler(() => redirect("/favicon.svg", 302));
