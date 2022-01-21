declare module '*.png' {
	const src: string;
	export default src;
}

interface Window {
	webpackJsonp: [
		number[],
		Record<
			string,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(module: any, exports: any, require: () => unknown) => unknown
		>,
		unknown[]
	][];
}
