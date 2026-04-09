/**
 * ExtPay Integration Script
 * Replace APP_URL with your actual deployed manager URL
 */
const APP_URL = 'https://your-app.onrender.com';

document.querySelectorAll('.extpay-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const planId = btn.getAttribute('data-plan-id');
        const email = prompt('Please enter your email for the license:');
        
        if (!email) return;

        // Show loading state
        const originalText = btn.innerText;
        btn.innerText = 'Processing...';
        btn.disabled = true;

        try {
            const response = await fetch(`${APP_URL}/pay/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: parseInt(planId),
                    email: email
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Redirect to Flutterwave checkout
                window.location.href = result.data.link;
            } else {
                alert('Error: ' + result.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (err) {
            console.error('Payment Error:', err);
            alert('Failed to connect to payment server.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
});
