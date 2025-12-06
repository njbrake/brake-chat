export function setTextScale(scale: number): void {
	if (typeof document !== 'undefined') {
		document.documentElement.style.setProperty('--text-scale', scale.toString());
		document.documentElement.style.fontSize = `${scale * 16}px`;
	}
}
