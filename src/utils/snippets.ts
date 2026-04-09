export function generateWebsiteCheckoutSnippet(extension: any, plan: any, appUrl: string) {
    return `
<!-- Flutterwave Checkout Button for ${extension.name} - ${plan.name} -->
<button id="buy-${extension.slug}-${plan.id}" class="flw-pay-button">
    Buy ${plan.name} ($${plan.price})
</button>

<script>
document.getElementById('buy-${extension.slug}-${plan.id}').addEventListener('click', async () => {
    const email = prompt('Please enter your email for the license:');
    if (!email) return;

    try {
        const response = await fetch('${appUrl}/pay/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                planId: ${plan.id},
                email: email
            })
        });
        const data = await response.json();
        if (data.status === 'success') {
            window.location.href = data.data.link;
        } else {
            alert('Error initializing payment: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Payment failed to initialize.');
    }
});
</script>
    `.trim();
}

export function generateExtensionVerificationCode(extension: any, appUrl: string) {
    return `
/**
 * Chrome Extension Background Script - License Verification
 * Place this in your background.js or service worker
 */

async function verifyLicense(licenseKey) {
    try {
        const response = await fetch('${appUrl}/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                licenseKey: licenseKey,
                extensionSlug: '${extension.slug}'
            })
        });
        const data = await response.json();
        return data; // { valid: true, plan: '...', expiresAt: '...' }
    } catch (err) {
        console.error('License verification failed', err);
        return { valid: false, error: 'Connection error' };
    }
}

// Example usage:
// chrome.storage.local.get(['licenseKey'], async (result) => {
//     if (result.licenseKey) {
//         const status = await verifyLicense(result.licenseKey);
//         if (!status.valid) {
//             // Handle invalid license (e.g., show paywall)
//         }
//     }
// });
    `.trim();
}
