const   jsonfile=document.currentScript.getAttribute("data");
const fragebogen_id="fragebogen";
const create_element = function(element = "div", attr = {}, text = "") {
  const item = document.createElement(element);
  if (attr) for (const key in attr) item.setAttribute(key, attr[key]);
  if (text) item.innerHTML = text; // OK for trusted strings
  return item;
};

async function json_initialising(url){
    const response = await fetch(url);// read content from url 
    const data = await response.json();// define type of fetch content
 	loadFromJSON(data);
}
// === core: build DOM from JSON object ===
function loadFromJSON(json) {
	let fragebogenwrap = document.getElementById(fragebogen_id);
	// Top title (if present)
	if (json.title !== undefined) {
		const title = json.title;
		const fb_title=create_element("h2",{id:"fb_title"},title);
		fragebogenwrap.appendChild(fb_title);
	}
	const qul=create_element("ul",{id:"question_wrap"});
	const navul=create_element("ul",{id:"nav_qa_wrap"});
	const qbtn=create_element("button",{id:"question_next",type:"button", onclick:"show_next()", style:"display: none;"},"weiter");
	let firstnavitem=true;	
	const entries = Object.entries(json.question || {}).sort((a,b)=> Number(a[0]) - Number(b[0]));
	entries.forEach(([idx, qObj]) => {
		const question=qObj.question;
		const qli=create_element("li",{class:"question_item"},"<div class='question_title'>"+question+"</div>");
		const navqli=create_element("li",{class:"nav_qa_item deactive",title:question/*,onclick:"nav_select(event)"*/},"<span class='nav_bg'></span><span class='nav_circle'></span>");
		if(firstnavitem==true){
			navqli.classList.add("active","current");
			navqli.classList.remove("deactive");
			firstnavitem=false;
		}
		if(idx==1)qli.classList.add("show");
		const answers = Object.entries(qObj.answers || {}).sort((a,b)=> Number(a[0]) - Number(b[0]));
		const aul=create_element("ul");

		answers.forEach(([aidx, aObj]) => {	
			const ali = create_element("li", { class: "answer_item" });
			const alabel = create_element("label");
			const aInput = create_element("input", {
			type: "radio",
			name: `antwort[${idx}]`,
			"data-target":aObj.target,
			value: aObj.answer
			});
			const atext = create_element("span", {},aObj.answer);
			alabel.append(aInput,atext);
			ali.appendChild(alabel);
			aul.appendChild(ali);
	
		});
		navul.appendChild(navqli);
		qli.appendChild(aul);
		qul.appendChild(qli);
		const target= qObj.target !== undefined;
	});
	navul.appendChild(create_element("li",{class:"nav_qa_end"},"<span class='nav_bg'></span><span class='nav_circle'></span>"));
	fragebogenwrap.append(navul,qul,qbtn);
	const qend=create_element("div",{id:"end_wrap"});
	// End block
	qend.style.display = "none";
	const endTitle = create_element("div",{id:"end_title"},json.end.title);
	const endText  = create_element("p",{id:"end_description"},json.end.discription);
	const endinputwrap= create_element("div",{id:"end_input_wrap"});
	const endMail  = json.end.email;
	
	const endemaillabel=create_element("label",{class:"email_label"},"<span>Email:</span>");
	const endemailinput=create_element("input",{type:"email", name:"email" , id:"email",placeholder:"z.b max@musterman.de"});
	endemaillabel.appendChild(endemailinput);
	
	const endnamelabel=create_element("label",{class:"name_label"},"<span>Name:</span>");
	const endvornameinput=create_element("input",{type:"text", name:"vorname" , id:"vorname",placeholder:"Vorname"});
	const endnachnameinput=create_element("input",{type:"text", name:"nachname" , id:"nachname",placeholder:"Nachname"});
	endnamelabel.append(endvornameinput,endnachnameinput);
	
	const endtellabel=create_element("label",{class:"tel_label"},"<span>Tel:</span>");
	const endtelinput=create_element("input",{type:"tel", name:"tel" , id:"tel",placeholder:"z.B +49 170 123456789"});
	endtellabel.appendChild(endtelinput);
	endinputwrap.append(endemaillabel,endnamelabel,endtellabel);
	
	const endsendemail=create_element("button",{id:"sendemail",type:"button",onclick:"send_email()"},"abschicken");
	qend.append(endTitle,endText,endinputwrap,endsendemail);
	
	const successwrap=create_element("div",{id:"successwrap",style:"display:none;"},"<p>Vielen dank fürs ausfüllen des Konstenlosen testen. Wir werden es so schnell wie möglich bearbeiten.</p>");
	fragebogenwrap.append( qend,successwrap);
	 const nextBtn = document.getElementById("question_next");
	  // add change listener for radios in the shown question
  const newRadios =fragebogenwrap.querySelectorAll("input[type='radio']");

if (newRadios.length) {
    newRadios.forEach(radio => {
        radio.addEventListener("change", () => {

            //  1. Alle answer_item-Boxen der aktuellen Frage zurücksetzen
            fragebogenwrap.querySelectorAll(".answer_item.current")
                  .forEach(li => li.classList.remove("current"));

            // 2. Die Parent-Box des ausgewählten Radios markieren
            const parentLi = radio.closest(".answer_item");
            if (parentLi) {
              console.log(parentLi);
                parentLi.classList.add("current");
            }

            //  3. Weiter-Button einblenden
            nextBtn.style.display = "inline-block";

        }, { once: false });   // ⬅️ wichtig: NICHT once:true → sonst bei Auswahlwechsel kein Update!
    });
} else {
    nextBtn.style.display = "inline-block";
}
}

function show_next() {
  const items   = document.querySelectorAll("#question_wrap > .question_item");
  const navitems   = document.querySelectorAll("#nav_qa_wrap > li");
  const navend   = document.querySelector("#nav_qa_wrap > .nav_qa_end");
  const nextBtn = document.getElementById("question_next");
  if (!items.length || !nextBtn) return;

  const current = document.querySelector("#question_wrap > .question_item.show");
  const currentnav = document.querySelector("#nav_qa_wrap > li.current");
  if (!current) return; // no visible question yet

  // selected radio in current question?
  const selected = current.querySelector("input[type='radio']:checked");
  if (!selected) {
    alert_call("Bitte wählen Sie eine Antwort, bevor Sie fortfahren.","info");
    return;
  }

  // read target (use data-target if you change your markup)
  const target = selected.dataset.target || ""; // or selected.dataset.target
  const currentIndex = Array.from(items).indexOf(current);

  // hide current
  current.classList.remove("show");
currentnav.classList.remove("current");
  let nextEl = null;
  let nextnav=null;
  switch (target) {
    case "default": {
      // go to next sequential (stop at end or loop; here: stop at end)
      const idx = currentIndex + 1;
      if (idx < items.length){ 
		  nextEl = items[idx];
		  nextnav=navitems[idx]; 	
	  } else {
        // reached the end; optionally show end screen
        const end = document.querySelector("#end_wrap");
        if (end) end.style.display = "block";
		 if (navend) navend.classList.add("active","current");  
		  nextBtn.style.display = "none";
		  document.getElementById("nav_qa_wrap").classList.add("end");
        // no next question, nothing more to do
        return;
      }
      break;
    }
    case "end": {
      const end = document.querySelector("#end_wrap");
      if (end) end.style.display = "block";
		 if (navend) navend.classList.add("active","current");
		 document.getElementById("nav_qa_wrap").classList.add("end");
      // hide Next; nothing else to show
      nextBtn.style.display = "none";
      return;
    }
    default: {
      // try to treat target as an index (supports 1-based or 0-based)
      const n = Number(target);
      if (!Number.isNaN(n)) {
        // prefer 1-based indexes (1..items.length). If out of range, try 0-based.
        let idx = n - 1; // 1-based â†’ 0-based
        if (idx < 0 || idx >= items.length) idx = n; // fallback: maybe it was 0-based
        if (idx >= 0 && idx < items.length){ nextEl = items[idx];nextnav=navitems[idx]; 	}
      }
      // if still no match, do nothing (you could fallback to default)
      break;
    }
  }

  if (!nextEl) return;

  // show next question
  	nextEl.classList.add("show");
	nextnav.classList.add("current");
    navitems.forEach((dot, i) => {
    if (i <= Array.from(items).indexOf(nextEl)) {
      dot.classList.remove("deactive");dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
  // hide Next button until a radio in the new question is selected
  nextBtn.style.display = "none";



}


function nav_select(event) {
	const items   = document.querySelectorAll("#question_wrap > .question_item");
	const navitems   = document.querySelectorAll("#nav_qa_wrap > li");
	// Get the clicked element
	const li = event.currentTarget || event.target;

	// Get index inside #nav_qa_wrap
	const list = document.querySelectorAll("#nav_qa_wrap > li");
	const idx = Array.from(list).indexOf(li);

	// Get its class list
	const classes = li.className; // or li.classList for a DOMTokenList
	
	document.querySelector("#nav_qa_wrap > li.current").classList.remove("current");
	const current = document.querySelector("#question_wrap > .question_item.show");

	if (current) {
	  current.classList.remove("show");
	} else {
	  const endWrap = document.querySelector("#end_wrap");
	  if (endWrap) endWrap.style.display = "none";
	}
	
	const nav = document.querySelector("#nav_qa_wrap");
if (nav && nav.classList.contains("end")) {
  nav.classList.remove("end");
}
	
	navitems[idx].classList.add("current");
 	items[idx].classList.add("show");
  
}

async function send_email() {
  // Basic input validation
  const email = document.getElementById("email").value.trim();
  const vorname = document.getElementById("vorname").value.trim();
  const nachname = document.getElementById("nachname").value.trim();
  const tel = document.getElementById("tel").value.trim();

  if (!email || !vorname || !nachname || !tel) {
    alert_call("Bitte füllen Sie alle Felder aus.","info");
    return;
  }

  // validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert_call("Bitte geben Sie eine gültige E-Mail-Adresse ein.","info");
    return;
  }

  // === collect all questions and selected answers ===
  const questions = document.querySelectorAll("#question_wrap > .question_item");
  let message = " Ergebnisse des Fragebogens:\n\n";

  questions.forEach((q, idx) => {
    const title = q.querySelector(".question_title")?.textContent.trim() || `Frage ${idx + 1}`;
    const selected = q.querySelector("input[type='radio']:checked");
    const answer = selected ? selected.value : "(keine Antwort)";
if(selected)
    message += `${idx + 1}. ${title}\n Antwort: ${answer}\n\n`;
  });

 
	// ... nachdem du message zusammengebaut hast:
window.parent.postMessage({
  type: 'fragebogenSubmit',
  payload: { email, vorname, nachname, tel, message }
}, '*');

// optional: Ergebnis anzeigen
window.addEventListener('message', (e) => {
  if (e.data?.type === 'sendResult') {
    if (e.data.ok) {
      success_call();
    } else {
      // aussagekräftige Meldungen je nach Code
      const code = e.data.code || e.data.error || e.data.step || 'UNBEKANNT';
      const map = {
        SYNTAX: 'Bitte eine gültige E-Mail-Adresse eingeben.',
        ROLE: 'Rollen-Adressen (info@, support@, …) sind nicht erlaubt.',
        DISPOSABLE: 'Wegwerf-E-Mail-Adressen sind nicht erlaubt.',
        NO_MX: 'Die Domain der E-Mail hat keine gültigen Mail-Einträge.',
        TOKEN: 'Zoho-Authentifizierung fehlgeschlagen.',
        UPSERT: 'Zoho konnte den Lead nicht speichern.'
      };
      alert_call(map[code] || 'Es ist ein Fehler aufgetreten.');
      console.log('Details:', e.data.details || '');
    }
  }
}, { once: true });



}

function success_call(){
  const success_element=document.getElementById("successwrap");
  document.getElementById("nav_qa_wrap").style.display="none";
  
  document.getElementById("end_wrap").style.display="none";
  success_element.style.display="block";

}

function alert_call(message = "Ein unbekannter Hinweis", type = "error") {
  const colors = {
    success: "rgba(40, 167, 69, 0.95)",  // grün
    error: "rgba(220, 53, 69, 0.95)",    // rot
    info: "rgba(23, 162, 184, 0.95)"     // blau
  }
  const fragebogenwrap = document.getElementById(fragebogen_id);
  if (!fragebogenwrap) {
    console.warn("❗ fragebogenwrap not found");
    return;
  }

 
  // Prüfen, ob das Alert-Div bereits existiert
  let alertBox = document.getElementById("alert");
    if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.id = "alert";
    fragebogenwrap.appendChild(alertBox);
  }
 
 const color = colors[type] || colors.error;

  alertBox.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color};             
    padding: 12px 22px;
    border-radius: 8px;
    font-size: 16px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    display: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
    max-width: 80%;
    text-align: center;
    line-height: 1.4;
    letter-spacing: 0.2px;
    font-family: system-ui, sans-serif;
    pointer-events: none;
  `;

  // Text dynamisch setzen
  alertBox.innerText = message;

  // Einblenden
  alertBox.style.display = "block";
  setTimeout(() => {
    alertBox.style.opacity = "1";
  }, 10);

  // Nach 3 Sekunden wieder ausblenden
  setTimeout(() => {
    alertBox.style.opacity = "0";
    setTimeout(() => {
      alertBox.style.display = "none";
    }, 300);
  }, 3000);
}


json_initialising(jsonfile);
// Auto-Resize nach außen senden
function sendHeight() {
  const height = document.body.scrollHeight;
  window.parent.postMessage({ type: "resizeFragebogen", height }, "*");
}

// Beim Laden und nach Änderungen neu senden
window.addEventListener("load", sendHeight);
new ResizeObserver(sendHeight).observe(document.body);







