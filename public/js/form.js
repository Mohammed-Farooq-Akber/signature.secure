document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('intakeForm');
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        status.style.display = 'none';

        try {
            const formData = new FormData(form);
            
            const response = await fetch('/api/intake', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                status.textContent = '? Request sent successfully! We\'ll contact you within 24 hours.';
                status.className = 'form-status success';
                status.style.display = 'block';
                form.reset();
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Form error:', error);
            status.textContent = '? Submission failed. Please try again.';
            status.className = 'form-status error';
            status.style.display = 'block';
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // File input styling
    const fileInput = document.getElementById('file');
    fileInput.addEventListener('change', function() {
        const label = this.parentNode.querySelector('label');
        if (this.files.length > 0) {
            label.textContent = `Selected: ${this.files[0].name}`;
        } else {
            label.textContent = 'Upload Document (Optional)';
        }
    });

    // Floating labels enhancement
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentNode.querySelector('label').style.color = 'rgba(255, 255, 255, 0.6)';
            }
        });
    });
});