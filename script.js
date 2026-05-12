const header = document.querySelector('.site-header');
const isHome = document.body.classList.contains('home');

if (header) {
  const syncHeader = () => {
    if (!isHome) {
      header.classList.remove('transparent');
      header.classList.add('solid');
      return;
    }
    if (window.scrollY > 12) {
      header.classList.add('solid');
      header.classList.remove('transparent');
    } else {
      header.classList.add('transparent');
      header.classList.remove('solid');
    }
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

const menuBtn = document.querySelector('.menu-btn');
if (menuBtn && header) {
  menuBtn.addEventListener('click', () => {
    const open = header.classList.toggle('mobile-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const buyerIntakeForm = document.querySelector('#buyer-intake-form');

if (buyerIntakeForm) {
  const submitButton = buyerIntakeForm.querySelector('#buyer-intake-submit');
  const statusMessage = buyerIntakeForm.querySelector('#buyer-intake-status');
  const emailInput = buyerIntakeForm.querySelector('#email');
  const errorFields = Array.from(buyerIntakeForm.querySelectorAll('[data-error-for]'));
  const getCheckedValues = (fieldName) =>
    Array.from(buyerIntakeForm.querySelectorAll(`input[name="${fieldName}"]:checked`)).map((input) => input.value);

  const syncSubmitState = () => {
    const hasValidEmail = emailInput.value.trim() && emailInput.checkValidity();
    submitButton.disabled = !hasValidEmail;
  };

  const setStatus = (message, type) => {
    statusMessage.textContent = message;
    statusMessage.className = `form-status form-status-${type}`;
    statusMessage.hidden = false;
  };

  const clearStatus = () => {
    statusMessage.hidden = true;
    statusMessage.textContent = '';
    statusMessage.className = 'form-status';
  };

  const setFieldError = (fieldName, message = '') => {
    const field = buyerIntakeForm.elements[fieldName];
    const errorNode = buyerIntakeForm.querySelector(`[data-error-for="${fieldName}"]`);
    const group = buyerIntakeForm.querySelector(`.checkbox-group input[name="${fieldName}"]`)?.closest('.checkbox-group');

    if (field && 'length' in field && !field.tagName) {
      Array.from(field).forEach((input) => input.setAttribute('aria-invalid', message ? 'true' : 'false'));
    } else if (field?.setAttribute) {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    if (group) {
      group.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    if (errorNode) {
      errorNode.textContent = message;
      if (message) {
        errorNode.closest('.form-section-collapsible')?.setAttribute('open', '');
      }
    }
  };

  const clearErrors = () => {
    errorFields.forEach((node) => {
      node.textContent = '';
    });

    Array.from(buyerIntakeForm.elements).forEach((field) => {
      if (field instanceof HTMLElement && 'setAttribute' in field) {
        field.setAttribute('aria-invalid', 'false');
      }
    });

    buyerIntakeForm.querySelectorAll('.checkbox-group').forEach((group) => {
      group.setAttribute('aria-invalid', 'false');
    });
  };

  const validateForm = () => {
    clearErrors();
    clearStatus();

    let isValid = true;
    const email = emailInput.value.trim();

    if (!email) {
      setFieldError('email', 'Email is required.');
      isValid = false;
    } else if (!emailInput.checkValidity()) {
      setFieldError('email', 'Enter a valid email address.');
      isValid = false;
    }

    return isValid;
  };

  const resetFormState = () => {
    buyerIntakeForm.reset();
    clearErrors();
    syncSubmitState();
  };

  buyerIntakeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatus('Please correct the highlighted fields and try again.', 'error');
      return;
    }

    const originalLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const fullName = buyerIntakeForm.elements.fullName.value.trim();
    const email = emailInput.value.trim();
    const phone = buyerIntakeForm.elements.phone.value.trim();
    const preferredContactMethod = buyerIntakeForm.elements.preferredContactMethod.value;
    const lookingToAcquire = getCheckedValues('lookingToAcquire');
    const agencyTypePreference = getCheckedValues('agencyTypePreference');
    const agencyStructure = getCheckedValues('agencyStructure');
    const agencySpecialties = getCheckedValues('agencySpecialties');
    const statesOfInterest = buyerIntakeForm.elements.statesOfInterest.value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const targetRevenueSize = getCheckedValues('targetRevenueSize');
    const notes = buyerIntakeForm.elements.notes.value.trim();

    try {
      clearStatus();

      const response = await fetch('https://api.glassriverinsure.com/external/buyer-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          preferredContactMethod,
          lookingToAcquire,
          agencyTypePreference,
          agencyStructure,
          agencySpecialties,
          statesOfInterest,
          targetRevenueSize,
          notes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Submission failed');
      }

      resetFormState();
      setStatus('Thank you. Your buyer intake was submitted successfully.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed';
      const friendlyMessage =
        message && message !== 'Submission failed'
          ? `We could not submit the form: ${message}. Please review the details and try again.`
          : 'We could not submit the form right now. Please try again in a moment.';
      setStatus(friendlyMessage, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim()) {
      setFieldError('email', emailInput.checkValidity() ? '' : 'Enter a valid email address.');
    } else {
      setFieldError('email', '');
    }
    syncSubmitState();
  });

  buyerIntakeForm.querySelectorAll('select, input, textarea').forEach((field) => {
    field.addEventListener('input', () => {
      if (field.name !== 'email') {
        setFieldError(field.name, '');
      }
      clearStatus();
      if (field.name !== 'email') {
        syncSubmitState();
      }
    });

    field.addEventListener('change', () => {
      if (field.name !== 'email') {
        setFieldError(field.name, '');
      }
      clearStatus();
      if (field.name !== 'email') {
        syncSubmitState();
      }
    });
  });

  syncSubmitState();
}
