'use strict';

// https://developer.apple.com/design/human-interface-guidelines/color#iOS-iPadOS-system-colors
const redColor = 'rgb(255, 59, 48)';
const greenColor = 'rgb(52, 199, 89)';

window.addEventListener('load', () => {
  setVh();
  initGenerateButton();
  initCopyButton();
});

/**
 * Safari is special about how it handles `vh`, so lets define our own
 */
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function initGenerateButton() {
  const generateButton = document.getElementById('generate-button');
  generateButton.addEventListener('click', () => onGeneratedDomain(generateName()));

  /**
   * 
   * @returns string
   */
  function generateName() {
    const maxLength = 7;
    const minLength = 5;
    const lengthDelta = maxLength - minLength;
    const length = maxLength - randomIntFromZeroTo(lengthDelta);
    const array = [...Array(length).keys()];
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randomLetter = () => letters[randomIntFromZeroTo(letters.length)];
    const string = array.map(randomLetter).join('');
    const capitalized = String.fromCharCode(string[0].charCodeAt(0) - 32) + string.slice(1);
    return capitalized;

    /**
     * 
     * @param {number} n 
     * @returns number
     */
    function randomIntFromZeroTo(n) {
      return Math.floor(randomFloatFromZeroToOne() * n);

      /**
       * 
       * @returns {number}
       */
      function randomFloatFromZeroToOne() {
        // Lets try CSPRNG for higher entropy
        if (crypto?.getRandomValues) {
          const array = new Uint32Array(1);
          crypto.getRandomValues(array);
          return array[0] / 0x100000000;
        }
        return Math.random();
      }
    }

  }

  /**
   * 
   * @param {string} name 
   */
  function onGeneratedDomain(name) {
    updateNameInput(name);
    updateNsLookupResults(name);

    /**
     * 
     * @param {string} value 
     */
    function updateNameInput(value) {
      const nameInput = document.getElementById('name-input');
      nameInput.value = value;
    }

    /**
     * 
     * @param {string} name 
     */
    function updateNsLookupResults(name) {
      const nslookupResultsElement = document.getElementById('nslookup-results');

      nslookupResultsElement.innerHTML = '';
      nslookupResultsElement.classList.remove('expanded');

      sleep(1000)
        .then(() => {
          const topLevelDomains = ['com', 'net', 'io', 'ai', 'app', 'dev'];
          topLevelDomains.forEach(topLevelDomain => {
            domainIsAvailable(`${name.toLowerCase()}.${topLevelDomain}`)
              .then(available => onDomainResolved(name.toLowerCase(), topLevelDomain, available));
          });
        });

      /**
       * 
       * @param {string} domain 
       * @returns {Promise<boolean>}
       */
      function domainIsAvailable(domain) {
        // https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6
        const NXDomain = 3;
        return nslookup(domain, 'A')
          .then(result => result.Status === NXDomain)
          .catch(error => {
            console.error(error);
            return false;
          })

        /**
         * https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/
         * @param {string} domain 
         * @param {string} type 
         * @returns {Promise<*>}
         */
        function nslookup(domain, type) {
          return fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`, {
            method: 'GET',
            headers: {
              accept: 'application/dns-json',
            }
          })
            .then(response => response.json());
        }
      }

      /**
       * 
       * @param {string} name 
       * @param {string} topLevelDomain 
       * @param {boolean} available 
       */
      function onDomainResolved(name, topLevelDomain, available) {
        const nslookupResultsElement = document.getElementById('nslookup-results');
        const resultElement = document.createElement('div');
        resultElement.className = 'nslookup-result';
        const nameElement = document.createElement('i');
        nameElement.innerText = name;
        resultElement.appendChild(nameElement);
        resultElement.appendChild(document.createTextNode(`.${topLevelDomain}\n`));
        resultElement.appendChild(document.createTextNode('is\n'));
        const availabilityElement = document.createElement('span');
        availabilityElement.className = available ? 'available' : 'unavailable';
        availabilityElement.innerText = available ? 'Available!' : 'Unavailable!';
        resultElement.appendChild(availabilityElement);
        nslookupResultsElement.appendChild(resultElement);
        nslookupResultsElement.classList.add('expanded');
      }
    }
  }

}

function initCopyButton() {
  let initialCopyButtonContent;
  const copyButton = document.getElementById('copy-button');
  initialCopyButtonContent = copyButton.innerText;
  copyButton.addEventListener('click', () => copyFromNameInput());

  function copyFromNameInput() {
    const nameInput = document.getElementById('name-input');
    const supportsNavigatorClipboard = navigator?.clipboard?.writeText;
    if (supportsNavigatorClipboard) {
      navigator.clipboard.writeText(nameInput.value)
        .then(() => {
          onCopySuccess();
        })
        .catch((error) => {
          console.error(error);
          onCopyFailure();
        });
      return;
    }

    nameInput.select && nameInput.select();
    const success = document.execCommand('copy');
    if (success) {
      onCopySuccess();
    } else {
      onCopyFailure();
    }
  }

  function onCopySuccess() {
    copyButtonAlert('✅ Copied!', greenColor);
  }

  function onCopyFailure() {
    copyButtonAlert('😱 Failed!', redColor);
  }

  /**
   * 
   * @param {string} text 
   * @param {string} color 
   */
  function copyButtonAlert(text, color) {
    const copyButton = document.getElementById('copy-button');
    copyButton.innerText = text;
    copyButton.style.backgroundColor = color;

    const notificationTimeoutMs = 5000;
    setTimeout(() => {
      copyButton.innerText = initialCopyButtonContent;
      copyButton.style.backgroundColor = '';
    }, notificationTimeoutMs);
  }
}

/**
 * 
 * @param {number} ms 
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
