import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { createElement, useEffect, useState } from "react";
import { makeGenericAPIRouteHandler } from "@keystatic/core/api/generic";
import { parseString } from "set-cookie-parser";
import { collection, config, fields } from "@keystatic/core";
import { block, wrapper } from "@keystatic/core/content-components";
//#region node_modules/@keystatic/astro/dist/keystatic-astro-api.js
function makeHandler(_config) {
	return async function keystaticAPIRoute(context) {
		var _context$locals, _ref, _config$clientId, _ref2, _config$clientSecret, _ref3, _config$secret;
		const envVarsForCf = (_context$locals = context.locals) === null || _context$locals === void 0 || (_context$locals = _context$locals.runtime) === null || _context$locals === void 0 ? void 0 : _context$locals.env;
		const { body, headers, status } = await makeGenericAPIRouteHandler({
			..._config,
			clientId: (_ref = (_config$clientId = _config.clientId) !== null && _config$clientId !== void 0 ? _config$clientId : envVarsForCf === null || envVarsForCf === void 0 ? void 0 : envVarsForCf.KEYSTATIC_GITHUB_CLIENT_ID) !== null && _ref !== void 0 ? _ref : tryOrUndefined(() => {
				return process.env.KEYSTATIC_GITHUB_CLIENT_ID;
			}),
			clientSecret: (_ref2 = (_config$clientSecret = _config.clientSecret) !== null && _config$clientSecret !== void 0 ? _config$clientSecret : envVarsForCf === null || envVarsForCf === void 0 ? void 0 : envVarsForCf.KEYSTATIC_GITHUB_CLIENT_SECRET) !== null && _ref2 !== void 0 ? _ref2 : tryOrUndefined(() => {
				return process.env.KEYSTATIC_GITHUB_CLIENT_SECRET;
			}),
			secret: (_ref3 = (_config$secret = _config.secret) !== null && _config$secret !== void 0 ? _config$secret : envVarsForCf === null || envVarsForCf === void 0 ? void 0 : envVarsForCf.KEYSTATIC_SECRET) !== null && _ref3 !== void 0 ? _ref3 : tryOrUndefined(() => {
				return process.env.KEYSTATIC_SECRET;
			})
		}, { slugEnvName: "PUBLIC_KEYSTATIC_GITHUB_APP_SLUG" })(context.request);
		let headersInADifferentStructure = /* @__PURE__ */ new Map();
		if (headers) if (Array.isArray(headers)) for (const [key, value] of headers) {
			if (!headersInADifferentStructure.has(key.toLowerCase())) headersInADifferentStructure.set(key.toLowerCase(), []);
			headersInADifferentStructure.get(key.toLowerCase()).push(value);
		}
		else if (typeof headers.entries === "function") {
			for (const [key, value] of headers.entries()) headersInADifferentStructure.set(key.toLowerCase(), [value]);
			if ("getSetCookie" in headers && typeof headers.getSetCookie === "function") {
				const setCookieHeaders2 = headers.getSetCookie();
				if (setCookieHeaders2 !== null && setCookieHeaders2 !== void 0 && setCookieHeaders2.length) headersInADifferentStructure.set("set-cookie", setCookieHeaders2);
			}
		} else for (const [key, value] of Object.entries(headers)) headersInADifferentStructure.set(key.toLowerCase(), [value]);
		const setCookieHeaders = headersInADifferentStructure.get("set-cookie");
		headersInADifferentStructure.delete("set-cookie");
		if (setCookieHeaders) for (const setCookieValue of setCookieHeaders) {
			var _options$sameSite;
			const { name, value, ...options } = parseString(setCookieValue);
			const sameSite = (_options$sameSite = options.sameSite) === null || _options$sameSite === void 0 ? void 0 : _options$sameSite.toLowerCase();
			context.cookies.set(name, value, {
				domain: options.domain,
				expires: options.expires,
				httpOnly: options.httpOnly,
				maxAge: options.maxAge,
				path: options.path,
				sameSite: sameSite === "lax" || sameSite === "strict" || sameSite === "none" ? sameSite : void 0
			});
		}
		return new Response(body, {
			status,
			headers: [...headersInADifferentStructure.entries()].flatMap(([key, val]) => val.map((x) => [key, x]))
		});
	};
}
function tryOrUndefined(fn) {
	try {
		return fn();
	} catch {
		return;
	}
}
//#endregion
//#region keystatic.config.ts
var sizeLabels = {
	small: "25%",
	medium: "50%",
	large: "75%",
	full: "100%"
};
var mdxComponents = {
	CustomImage: block({
		label: "Advanced Image",
		schema: {
			src: fields.image({
				label: "Image",
				directory: "src/assets",
				publicPath: "../../assets/"
			}),
			alt: fields.text({ label: "Alt Text (Optional)" }),
			align: fields.select({
				label: "Alignment",
				options: [
					{
						label: "Left",
						value: "left"
					},
					{
						label: "Center",
						value: "center"
					},
					{
						label: "Right",
						value: "right"
					}
				],
				defaultValue: "center"
			}),
			size: fields.select({
				label: "Size",
				options: [
					{
						label: "Small (25%)",
						value: "small"
					},
					{
						label: "Medium (50%)",
						value: "medium"
					},
					{
						label: "Large (75%)",
						value: "large"
					},
					{
						label: "Full Width (100%)",
						value: "full"
					}
				],
				defaultValue: "medium"
			}),
			caption: fields.text({ label: "Caption (Optional)" })
		},
		ContentView: function(props) {
			const align = props.value.align ?? "center";
			const width = sizeLabels[props.value.size ?? "medium"] ?? "50%";
			const flexAlign = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
			const [objectUrl, setObjectUrl] = useState("");
			useEffect(() => {
				if (typeof props.value.src === "object" && props.value.src !== null && props.value.src.data) {
					let arrayData;
					if (props.value.src.data instanceof Uint8Array) arrayData = props.value.src.data;
					else arrayData = new Uint8Array(Object.values(props.value.src.data));
					const extension = props.value.src.extension || "png";
					const blob = new Blob([arrayData], { type: `image/${extension}` });
					const url = URL.createObjectURL(blob);
					setObjectUrl(url);
					return () => URL.revokeObjectURL(url);
				}
			}, [props.value.src]);
			let imgSrc = "";
			if (typeof props.value.src === "string") imgSrc = props.value.src.startsWith("http") || props.value.src.startsWith("blob:") ? props.value.src : `/src/assets/${props.value.src}`;
			else if (objectUrl) imgSrc = objectUrl;
			const imageNode = imgSrc ? createElement("img", {
				src: imgSrc,
				alt: props.value.alt || "Advanced Image",
				style: {
					width: "100%",
					height: "auto",
					borderRadius: "8px",
					display: "block"
				}
			}) : createElement("div", { style: {
				width: "100%",
				padding: "24px",
				background: "#f1f5f9",
				border: "2px dashed #cbd5e1",
				borderRadius: "8px",
				textAlign: "center",
				color: "#64748b",
				fontSize: "13px"
			} }, "🖼️ Click \"Edit\" to select an image");
			return createElement("div", { style: {
				display: "flex",
				flexDirection: "column",
				alignItems: flexAlign,
				padding: "8px 0",
				width: "100%"
			} }, createElement("div", { style: { width } }, imageNode), props.value.caption ? createElement("p", { style: {
				fontSize: "12px",
				color: "#64748b",
				marginTop: "8px",
				fontStyle: "italic",
				textAlign: "center"
			} }, props.value.caption) : null);
		}
	}),
	Callout: wrapper({
		label: "Callout",
		schema: {
			type: fields.select({
				label: "Type",
				options: [
					{
						label: "Info",
						value: "info"
					},
					{
						label: "Warning",
						value: "warning"
					},
					{
						label: "Success",
						value: "success"
					},
					{
						label: "Danger",
						value: "danger"
					}
				],
				defaultValue: "info"
			}),
			title: fields.text({ label: "Title (Optional)" })
		}
	}),
	Tabs: wrapper({
		label: "Tabs Group",
		schema: {}
	}),
	TabItem: wrapper({
		label: "Tab Item",
		schema: { label: fields.text({ label: "Tab Label" }) }
	})
};
var keystatic_config_default = config({
	storage: {
		kind: "github",
		repo: "Setfact/Blog-and-Course-website"
	},
	ui: { brand: { name: "Phinisi Network CMS" } },
	collections: {
		docs: collection({
			label: "Courses (Docs)",
			slugField: "title",
			path: "src/content/docs/**",
			format: { contentField: "content" },
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				language: fields.select({
					label: "Language",
					options: [{
						label: "Indonesia",
						value: "id"
					}, {
						label: "English",
						value: "en"
					}],
					defaultValue: "id"
				}),
				draft: fields.checkbox({
					label: "Draft",
					description: "Centang untuk menyembunyikan materi ini dari website",
					defaultValue: false
				}),
				description: fields.text({
					label: "Description",
					multiline: true
				}),
				order: fields.integer({
					label: "Order",
					defaultValue: 1
				}),
				icon: fields.text({ label: "Icon (Optional)" }),
				learningPaths: fields.array(fields.object({
					path: fields.relationship({
						label: "Learning Path",
						collection: "paths"
					}),
					order: fields.integer({
						label: "Urutan di dalam Path ini",
						defaultValue: 1,
						description: "Materi ini akan muncul di posisi ke-berapa dalam Learning Path tersebut?"
					})
				}), {
					label: "Learning Paths (Optional)",
					description: "Tambahkan Path dan atur urutannya masing-masing",
					itemLabel: (props) => {
						return `${props.fields.path.value ?? "Belum dipilih"} — Urutan #${props.fields.order.value ?? 1}`;
					}
				}),
				content: fields.mdx({
					label: "Content",
					components: mdxComponents
				})
			}
		}),
		blog: collection({
			label: "Blog Posts",
			slugField: "title",
			path: "src/content/blog/*",
			format: { contentField: "content" },
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				language: fields.select({
					label: "Language",
					options: [{
						label: "Indonesia",
						value: "id"
					}, {
						label: "English",
						value: "en"
					}],
					defaultValue: "id"
				}),
				draft: fields.checkbox({
					label: "Draft",
					description: "Centang untuk menyembunyikan post ini dari website",
					defaultValue: false
				}),
				description: fields.text({
					label: "Description",
					multiline: true
				}),
				date: fields.date({
					label: "Date",
					defaultValue: { kind: "today" }
				}),
				category: fields.select({
					label: "Category",
					options: [
						{
							label: "Technology",
							value: "Technology"
						},
						{
							label: "Networking",
							value: "Networking"
						},
						{
							label: "Cloud",
							value: "Cloud"
						},
						{
							label: "Security",
							value: "Security"
						},
						{
							label: "Linux",
							value: "Linux"
						}
					],
					defaultValue: "Technology"
				}),
				image: fields.image({
					label: "Cover Image (Optional)",
					directory: "public/images/blog",
					publicPath: "/images/blog/"
				}),
				content: fields.mdx({
					label: "Content",
					components: mdxComponents
				})
			}
		}),
		paths: collection({
			label: "Learning Paths",
			slugField: "title",
			path: "src/content/paths/*",
			format: { contentField: "content" },
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				language: fields.select({
					label: "Language",
					options: [{
						label: "Indonesia",
						value: "id"
					}, {
						label: "English",
						value: "en"
					}],
					defaultValue: "id"
				}),
				draft: fields.checkbox({
					label: "Draft",
					description: "Centang untuk menyembunyikan learning path ini dari website",
					defaultValue: false
				}),
				description: fields.text({
					label: "Description",
					multiline: true
				}),
				content: fields.mdx({
					label: "Content",
					components: mdxComponents
				})
			}
		})
	}
});
//#endregion
//#region node_modules/@keystatic/astro/internal/keystatic-api.js
var keystatic_api_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	all: () => all,
	prerender: () => false
});
var all = makeHandler({ config: keystatic_config_default });
var ALL = all;
//#endregion
//#region \0virtual:astro:page:node_modules/@keystatic/astro/internal/keystatic-api@_@js
var page = () => keystatic_api_exports;
//#endregion
export { page };
