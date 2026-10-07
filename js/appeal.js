(function () {
      
      var form = document.getElementById('appealForm');
      var btn = document.getElementById('submitBtn');
      var label = document.getElementById('submitLabel');
      var okBox = document.getElementById('successBox');
      var errBox = document.getElementById('errorBox');
      var reason = document.getElementById('reason');
      var count = document.getElementById('reasonCount');

      var f = {
        username: document.getElementById('username'),
        type: document.getElementById('punishmentType'),
        id: document.getElementById('punishmentId'),
        reason: reason
      };
      var errs = {
        username: document.getElementById('usernameErr'),
        type: document.getElementById('typeErr'),
        id: document.getElementById('idErr'),
        reason: document.getElementById('reasonErr')
      };

      reason.addEventListener('input', function () {
        count.textContent = reason.value.length + ' / 1000';
      });

      function setErr(key, msg) {
        errs[key].textContent = msg;
        f[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
        return !msg;
      }

      function validate() {
        var u = f.username.value.trim();
        var id = f.id.value.trim();
        var r = f.reason.value.trim();
        var results = [
          setErr('username', /^[A-Za-z0-9_. ]{3,17}$/.test(u) ? '' : 'Enter a valid username (3–17 letters, numbers, spaces, . or _).'),
          setErr('type', (f.type.value === 'Ban' || f.type.value === 'Mute') ? '' : 'Choose Ban or Mute.'),
          setErr('id', (!id || /^[A-Za-z0-9#_-]{1,32}$/.test(id)) ? '' : 'Use only letters, numbers, #, _ or -.'),
          setErr('reason', (r.length >= 20 && r.length <= 1000) ? '' : 'Your reason must be between 20 and 1000 characters.')
        ];
        if (results.every(Boolean)) return true;
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return false;
      }

      function setBusy(busy) {
        btn.disabled = busy;
        btn.setAttribute('aria-busy', String(busy));
        label.textContent = busy ? 'Submitting...' : 'Submit appeal';
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        okBox.hidden = true;
        errBox.hidden = true;
        if (!validate()) return;

        setBusy(true);
        fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: f.username.value.trim(),
            punishmentType: f.type.value,
            punishmentId: f.id.value.trim(),
            reason: f.reason.value.trim(),
            website: document.getElementById('website').value
          })
        })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
              return { ok: res.ok && data.success === true, status: res.status, data: data };
            });
          })
          .then(function (r) {
            if (r.ok) {
              okBox.textContent = 'Your appeal was submitted successfully. Our staff team will review it.';
              okBox.hidden = false;
              form.reset();
              count.textContent = '0 / 1000';
              Object.keys(f).forEach(function (k) { setErr(k, ''); });
            } else {
              var msg = 'We couldn\u2019t submit your appeal right now. Please try again later.';
              if (r.status === 400 && r.data && r.data.message) msg = r.data.message;
              if (r.status === 429) msg = 'Too many appeals submitted. Please wait a while before trying again.';
              errBox.textContent = msg;
              errBox.hidden = false;
            }
          })
          .catch(function () {
            errBox.textContent = 'We couldn\u2019t submit your appeal right now. Please try again later.';
            errBox.hidden = false;
          })
          .then(function () { setBusy(false); });
      });
    })();
