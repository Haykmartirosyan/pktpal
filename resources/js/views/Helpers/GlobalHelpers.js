/**
 * Paste Address
 * @param address
 */
export function copyAddress(address) {
    const el = document.createElement('textarea');
    el.value = address;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

/**
 * Paste Address
 */
export function pasteAddress() {
    if (!navigator.clipboard) return;
    navigator.clipboard.readText().then(clipText => {
            document.getElementById("toAddress").value = clipText
        }
    );
}
