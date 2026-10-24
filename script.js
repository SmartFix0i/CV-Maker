document.addEventListener("DOMContentLoaded", () => { const $ = (s, p = document) => p.querySelector(s); const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const storageKey = "resumecraft-data-v1";

const sections = ["personal", "experience", "education", "skills"];
let currentTab = 0;
let zoom = 1;
let photoData = "";
let toastTimer;
let saveTimer;

let skills = ["HTML5", "CSS3", "JavaScript"];

const defaultData = {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    website: "",
    summary: ""
};

// ==================== TOAST ====================

function toast(message, success = true) {
    const box = $("#toastMessage");
    $("#toastText").textContent = message;

    const icon = $("i", box);
    icon.className = success
        ? "fa-solid fa-circle-check"
        : "fa-solid fa-circle-exclamation";

    box.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        box.classList.remove("show");
    }, 2600);
}

// ==================== SAFE HTML ====================

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function safeURL(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
}

// ==================== TABS ====================

function showTab(index) {
    currentTab = Math.max(0, Math.min(index, sections.length - 1));

    $$(".editor-tab").forEach((tab, i) => {
        const active = i === currentTab;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
    });

    sections.forEach((section, i) => {
        const panel = $(`#tab-${section}`);
        panel.hidden = i !== currentTab;
        panel.classList.toggle("active", i === currentTab);
    });

    $("#backBtn").disabled = currentTab === 0;

    $("#nextBtn").innerHTML = currentTab === sections.length - 1
        ? 'Finish <i class="fa-solid fa-check"></i>'
        : 'Next section <i class="fa-solid fa-arrow-right"></i>';

    $("#nextBtn").disabled = false;
}

$$(".editor-tab").forEach((tab, i) => {
    tab.addEventListener("click", () => showTab(i));
});

$("#backBtn").addEventListener("click", () => {
    showTab(currentTab - 1);
});

$("#nextBtn").addEventListener("click", () => {
    if (currentTab < sections.length - 1) {
        showTab(currentTab + 1);
    } else {
        updatePreview();
        toast("Your resume is ready to preview!");
        $("#resumeStage").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});

// ==================== PERSONAL DETAILS ====================

const personalFields = [
    "fullName",
    "jobTitle",
    "email",
    "phone",
    "address",
    "linkedin",
    "website",
    "summary"
];

function getValue(id) {
    return $(`#${id}`).value.trim();
}

function setText(id, value, fallback = "") {
    $(`#${id}`).textContent = value || fallback;
}

function updatePersonalPreview() {
    setText("previewName", getValue("fullName"), "Your Name");
    setText("previewJobTitle", getValue("jobTitle"), "Your Professional Title");
    setText("previewEmail", getValue("email"), "your.email@example.com");
    setText("previewPhone", getValue("phone"), "+1 234 567 890");
    setText("previewAddress", getValue("address"), "City, Country");

    const summary = getValue("summary");

    setText(
        "previewSummary",
        summary,
        "Your professional summary will appear here. Write a concise introduction highlighting your experience, key strengths, and career goals."
    );

    $("#summaryCount").textContent = $("#summary").value.length;

    const links = [];

    const linkedin = safeURL(getValue("linkedin"));
    const website = safeURL(getValue("website"));

    if (linkedin) {
        links.push(
            `<a href="${escapeHTML(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
        );
    }

    if (website) {
        links.push(
            `<a href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">Portfolio</a>`
        );
    }

    $("#previewSocialLinks").innerHTML = links.join("");
}

// ==================== EXPERIENCE ====================

function collectExperiences() {
    return $$(".experience-item").map(card => ({
        title: $('[name="expTitle"]', card).value.trim(),
        company: $('[name="expCompany"]', card).value.trim(),
        start: $('[name="expStart"]', card).value,
        end: $('[name="expEnd"]', card).value,
        current: $('[name="expCurrent"]', card).checked,
        description: $('[name="expDescription"]', card).value.trim()
    })).filter(item =>
        item.title || item.company || item.start ||
        item.end || item.description
    );
}

function updateExperiencePreview() {
    const items = collectExperiences();
    const container = $("#previewExperienceList");

    if (!items.length) {
        container.innerHTML = `
            <article class="resume-entry">
                <div class="resume-entry-heading">
                    <h3>Job Title</h3>
                    <span class="resume-date">Start – End</span>
                </div>
                <p class="resume-entry-subtitle">Company Name</p>
                <p class="resume-entry-description">
                    Your work experience and achievements will appear here.
                </p>
            </article>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const start = item.start || "";
        const end = item.current ? "Present" : item.end;

        const dates = [start, end].filter(Boolean).join(" – ");

        return `
            <article class="resume-entry">
                <div class="resume-entry-heading">
                    <h3>${escapeHTML(item.title || "Job Title")}</h3>
                    <span class="resume-date">${escapeHTML(dates)}</span>
                </div>

                <p class="resume-entry-subtitle">
                    ${escapeHTML(item.company)}
                </p>

                <p class="resume-entry-description">${escapeHTML(item.description)}</p>
            </article>`;
    }).join("");
}

function addExperience(data = {}) {
    const card = document.createElement("article");

    card.className = "repeatable-card experience-item";

    card.innerHTML = `
        <div class="repeatable-card-header">
            <h4><i class="fa-solid fa-building"></i> Experience</h4>
            <button type="button" class="remove-btn"
                data-remove="experience" aria-label="Remove experience">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>

        <div class="form-grid">
            <div class="form-group full-width">
                <label>Job title</label>
                <input name="expTitle" maxlength="120"
                    placeholder="e.g. Software Engineer">
            </div>

            <div class="form-group full-width">
                <label>Company name</label>
                <input name="expCompany" maxlength="150"
                    placeholder="e.g. Acme Inc.">
            </div>

            <div class="form-group">
                <label>Start date</label>
                <input type="month" name="expStart">
            </div>

            <div class="form-group">
                <label>End date</label>
                <input type="month" name="expEnd">
            </div>

            <div class="form-group full-width checkbox-group">
                <label>
                    <input type="checkbox" name="expCurrent">
                    I currently work here
                </label>
            </div>

            <div class="form-group full-width">
                <label>Description</label>
                <textarea name="expDescription" rows="4"
                    maxlength="1500"
                    placeholder="Describe your achievements..."></textarea>
            </div>
        </div>`;

    $('[name="expTitle"]', card).value = data.title || "";
    $('[name="expCompany"]', card).value = data.company || "";
    $('[name="expStart"]', card).value = data.start || "";
    $('[name="expEnd"]', card).value = data.end || "";
    $('[name="expCurrent"]', card).checked = !!data.current;
    $('[name="expDescription"]', card).value = data.description || "";

    $("#experienceList").appendChild(card);
    updateCardTitles();
}

// ==================== EDUCATION ====================

function collectEducation() {
    return $$(".education-item").map(card => ({
        degree: $('[name="eduDegree"]', card).value.trim(),
        school: $('[name="eduSchool"]', card).value.trim(),
        start: $('[name="eduStart"]', card).value,
        end: $('[name="eduEnd"]', card).value,
        description: $('[name="eduDescription"]', card).value.trim()
    })).filter(item =>
        item.degree || item.school || item.start ||
        item.end || item.description
    );
}

function updateEducationPreview() {
    const items = collectEducation();
    const container = $("#previewEducationList");

    if (!items.length) {
        container.innerHTML = `
            <article class="resume-entry">
                <div class="resume-entry-heading">
                    <h3>Your Degree</h3>
                    <span class="resume-date">Year</span>
                </div>
                <p class="resume-entry-subtitle">University or Institution</p>
            </article>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const dates = [item.start, item.end].filter(Boolean).join(" – ");

        return `
            <article class="resume-entry">
                <div class="resume-entry-heading">
                    <h3>${escapeHTML(item.degree || "Qualification")}</h3>
                    <span class="resume-date">${escapeHTML(dates)}</span>
                </div>

                <p class="resume-entry-subtitle">${escapeHTML(item.school)}</p>

                <p class="resume-entry-description">${escapeHTML(item.description)}</p>
            </article>`;
    }).join("");
}

function addEducation(data = {}) {
    const card = document.createElement("article");

    card.className = "repeatable-card education-item";

    card.innerHTML = `
        <div class="repeatable-card-header">
            <h4><i class="fa-solid fa-book-open"></i> Education</h4>
            <button type="button" class="remove-btn"
                data-remove="education" aria-label="Remove education">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>

        <div class="form-grid">
            <div class="form-group full-width">
                <label>Degree / Qualification</label>
                <input name="eduDegree" maxlength="150"
                    placeholder="e.g. Bachelor's in Computer Science">
            </div>

            <div class="form-group full-width">
                <label>Institution</label>
                <input name="eduSchool" maxlength="150"
                    placeholder="University or college name">
            </div>

            <div class="form-group">
                <label>Start year</label>
                <input type="number" name="eduStart"
                    min="1950" max="2100" placeholder="2020">
            </div>

            <div class="form-group">
                <label>Graduation year</label>
                <input type="number" name="eduEnd"
                    min="1950" max="2100" placeholder="2024">
            </div>

            <div class="form-group full-width">
                <label>Additional details</label>
                <textarea name="eduDescription" rows="3"
                    maxlength="800"
                    placeholder="Achievements or relevant coursework..."></textarea>
            </div>
        </div>`;

    $('[name="eduDegree"]', card).value = data.degree || "";
    $('[name="eduSchool"]', card).value = data.school || "";
    $('[name="eduStart"]', card).value = data.start || "";
    $('[name="eduEnd"]', card).value = data.end || "";
    $('[name="eduDescription"]', card).value = data.description || "";

    $("#educationList").appendChild(card);
    updateCardTitles();
}

// ==================== CARD TITLES ====================

function updateCardTitles() {
    $$(".experience-item").forEach((card, index) => {
        $("h4", card).innerHTML =
            `<i class="fa-solid fa-building"></i> Experience ${index + 1}`;
    });

    $$(".education-item").forEach((card, index) => {
        $("h4", card).innerHTML =
            `<i class="fa-solid fa-book-open"></i> Education ${index + 1}`;
    });
}

// ==================== ADD / REMOVE ITEMS ====================

$("#addExperience").addEventListener("click", () => {
    addExperience();
    updatePreview();
    toast("Experience added.");
});

$("#addEducation").addEventListener("click", () => {
    addEducation();
    updatePreview();
    toast("Education added.");
});

document.addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");

    if (!button) return;

    const type = button.dataset.remove;
    const card = button.closest(
        type === "experience" ? ".experience-item" : ".education-item"
    );

    if (!card) return;

    const list = type === "experience"
        ? $$(".experience-item")
        : $$(".education-item");

    if (list.length <= 1) {
        $$("input, textarea", card).forEach(input => {
            if (input.type === "checkbox") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });
    } else {
        card.remove();
    }

    updateCardTitles();
    updatePreview();
    toast("Item removed.");
});

// ==================== SKILLS ====================

function renderSkills() {
    const container = $("#skillsContainer");

    container.innerHTML = skills.map(skill => `
        <span class="skill-chip">
            ${escapeHTML(skill)}
            <button type="button"
                data-skill-remove="${escapeHTML(skill)}"
                aria-label="Remove ${escapeHTML(skill)}">&times;</button>
        </span>
    `).join("");

    $("#previewSkills").innerHTML = skills.length
        ? skills.map(skill => `<span>${escapeHTML(skill)}</span>`).join("")
        : "<span>Add your skills</span>";
}

function addSkill() {
    const input = $("#skillInput");
    const skill = input.value.trim();

    if (!skill) {
        input.focus();
        return;
    }

    if (skills.some(item => item.toLowerCase() === skill.toLowerCase())) {
        toast("This skill already exists.", false);
        return;
    }

    if (skills.length >= 30) {
        toast("Maximum 30 skills allowed.", false);
        return;
    }

    skills.push(skill);
    input.value = "";

    renderSkills();
    updatePreview();
    input.focus();
}

$("#addSkillBtn").addEventListener("click", addSkill);

$("#skillInput").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        addSkill();
    }
});

$("#skillsContainer").addEventListener("click", event => {
    const button = event.target.closest("[data-skill-remove]");

    if (!button) return;

    const skill = button.dataset.skillRemove;

    skills = skills.filter(item => item !== skill);

    renderSkills();
    updatePreview();
    toast("Skill removed.");
});

// ==================== PROFILE PHOTO ====================

$("#profilePhoto").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast("Choose a JPG, PNG or WebP image.", false);
        event.target.value = "";
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        toast("Please choose an image smaller than 3 MB.", false);
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        photoData = reader.result;

        const preview = $("#photoPreview");
        preview.innerHTML = "";

        const img = document.createElement("img");
        img.src = photoData;
        img.alt = "Uploaded profile photo";

        preview.appendChild(img);

        $("#previewPhoto").src = photoData;
        $("#previewPhoto").hidden = false;
        $("#previewPhotoPlaceholder").hidden = true;

        updatePreview();
        toast("Profile photo updated.");
    };

    reader.onerror = () => toast("Could not read this image.", false);

    reader.readAsDataURL(file);
});

// ==================== TEMPLATE SWITCHING ====================

$$(".template-option").forEach(button => {
    button.addEventListener("click", () => {
        const template = button.dataset.template;

        $("#resumePaper").classList.remove(
            "template-modern",
            "template-classic",
            "template-minimal"
        );

        $("#resumePaper").classList.add(`template-${template}`);

        $$(".template-option").forEach(option => {
            const active = option === button;

            option.classList.toggle("active", active);
            option.setAttribute("aria-pressed", String(active));
        });

        scheduleSave();
        toast(`${template.charAt(0).toUpperCase() + template.slice(1)} template selected.`);
    });
});

// ==================== ZOOM ====================

function setZoom(value) {
    zoom = Math.max(0.4, Math.min(1.2, value));

    $("#zoomLevel").textContent = `${Math.round(zoom * 100)}%`;

    $("#resumePaper").style.setProperty("--resume-scale", zoom);

    $("#zoomOut").disabled = zoom <= 0.4;
    $("#zoomIn").disabled = zoom >= 1.2;
}

$("#zoomIn").addEventListener("click", () => setZoom(zoom + 0.1));
$("#zoomOut").addEventListener("click", () => setZoom(zoom - 0.1));

// ==================== FULLSCREEN ====================

$("#fullscreenBtn").addEventListener("click", () => {
    const panel = $(".preview-panel");
    const fullscreen = panel.classList.toggle("is-fullscreen");

    document.body.style.overflow = fullscreen ? "hidden" : "";

    $("#fullscreenBtn").innerHTML = fullscreen
        ? '<i class="fa-solid fa-compress"></i>'
        : '<i class="fa-solid fa-expand"></i>';

    $("#fullscreenBtn").title = fullscreen
        ? "Exit fullscreen"
        : "Toggle preview fullscreen";
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const panel = $(".preview-panel");

        if (panel.classList.contains("is-fullscreen")) {
            panel.classList.remove("is-fullscreen");
            document.body.style.overflow = "";

            $("#fullscreenBtn").innerHTML =
                '<i class="fa-solid fa-expand"></i>';
        }

        $("#resetModal").hidden = true;
    }
});

// ==================== MOBILE MENU ====================

$("#mobileMenuBtn").addEventListener("click", () => {
    const nav = $(".nav-links");
    const isOpen = nav.classList.toggle("open");

    $("#mobileMenuBtn").innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';

    $("#mobileMenuBtn").setAttribute("aria-expanded", String(isOpen));
});

$$(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        $(".nav-links").classList.remove("open");

        $("#mobileMenuBtn").innerHTML =
            '<i class="fa-solid fa-bars"></i>';

        $("#mobileMenuBtn").setAttribute("aria-expanded", "false");
    });
});

// ==================== COMPLETION PROGRESS ====================

function updateProgress() {
    const checks = [
        !!getValue("fullName"),
        !!getValue("jobTitle"),
        !!getValue("email"),
        !!getValue("phone"),
        !!getValue("address"),
        !!getValue("summary"),
        collectExperiences().length > 0,
        collectEducation().length > 0,
        skills.length > 0,
        !!photoData
    ];

    const completed = checks.filter(Boolean).length;
    const percentage = Math.round(completed / checks.length * 100);

    $("#progressText").textContent = `${percentage}%`;
    $("#progressFill").style.width = `${percentage}%`;
}

// ==================== LIVE PREVIEW ====================

function updatePreview() {
    updatePersonalPreview();
    updateExperiencePreview();
    updateEducationPreview();
    renderSkills();
    updateProgress();
    scheduleSave();
}

document.addEventListener("input", event => {
    if (event.target.closest("#editor")) {
        updatePreview();
    }
});

document.addEventListener("change", event => {
    if (event.target.closest("#editor")) {
        updatePreview();
    }
});

// ==================== AUTOSAVE ====================

function collectData() {
    const personal = {};

    personalFields.forEach(field => {
        personal[field] = $(`#${field}`).value;
    });

    return {
        personal,
        experiences: collectExperiences(),
        education: collectEducation(),
        skills,
        photoData,
        template: $(".template-option.active")?.dataset.template || "modern"
    };
}

function scheduleSave() {
    $("#saveStatus").textContent = "Saving...";

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(collectData()));
            $("#saveStatus").textContent = "Saved locally";
        } catch (error) {
            $("#saveStatus").textContent = "Not saved";
            console.warn("Resume autosave failed:", error);
        }
    }, 350);
}

function loadData() {
    try {
        const saved = localStorage.getItem(storageKey);

        if (!saved) return false;

        const data = JSON.parse(saved);

        if (!data || typeof data !== "object") return false;

        personalFields.forEach(field => {
            const value = data.personal?.[field];

            if (typeof value === "string") {
                $(`#${field}`).value = value;
            }
        });

        if (Array.isArray(data.experiences) && data.experiences.length) {
            $("#experienceList").innerHTML = "";

            data.experiences.slice(0, 20).forEach(addExperience);
        }

        if (Array.isArray(data.education) && data.education.length) {
            $("#educationList").innerHTML = "";

            data.education.slice(0, 20).forEach(addEducation);
        }

        if (Array.isArray(data.skills)) {
            skills = data.skills
                .filter(skill => typeof skill === "string")
                .slice(0, 30);
        }

        if (
            typeof data.photoData === "string" &&
            data.photoData.startsWith("data:image/") &&
            data.photoData.length < 5_000_000
        ) {
            photoData = data.photoData;

            $("#previewPhoto").src = photoData;
            $("#previewPhoto").hidden = false;
            $("#previewPhotoPlaceholder").hidden = true;

            const img = document.createElement("img");
            img.src = photoData;
            img.alt = "Uploaded profile photo";

            $("#photoPreview").innerHTML = "";
            $("#photoPreview").appendChild(img);
        }

        const template = ["modern", "classic", "minimal"].includes(data.template)
            ? data.template
            : "modern";

        $("#resumePaper").classList.remove(
            "template-modern",
            "template-classic",
            "template-minimal"
        );

        $("#resumePaper").classList.add(`template-${template}`);

        $$(".template-option").forEach(button => {
            const active = button.dataset.template === template;

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        updateCardTitles();

        return true;

    } catch (error) {
        console.warn("Could not restore saved resume:", error);
        return false;
    }
}

// ==================== RESET RESUME ====================

$("#resetBtn").addEventListener("click", () => {
    $("#resetModal").hidden = false;
    $("#cancelResetBtn").focus();
});

$("#cancelResetBtn").addEventListener("click", () => {
    $("#resetModal").hidden = true;
});

$("#resetModal").addEventListener("click", event => {
    if (event.target === $("#resetModal")) {
        $("#resetModal").hidden = true;
    }
});

$("#confirmResetBtn").addEventListener("click", () => {
    personalFields.forEach(field => {
        $(`#${field}`).value = defaultData[field];
    });

    $("#experienceList").innerHTML = "";
    $("#educationList").innerHTML = "";

    addExperience();
    addEducation();

    skills = ["HTML5", "CSS3", "JavaScript"];
    photoData = "";

    $("#profilePhoto").value = "";

    $("#photoPreview").innerHTML =
        '<i class="fa-solid fa-user"></i>';

    $("#previewPhoto").src = "";
    $("#previewPhoto").hidden = true;
    $("#previewPhotoPlaceholder").hidden = false;

    $("#resumePaper").classList.remove(
        "template-classic",
        "template-minimal"
    );

    $("#resumePaper").classList.add("template-modern");

    $$(".template-option").forEach(button => {
        const active = button.dataset.template === "modern";

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    try {
        localStorage.removeItem(storageKey);
    } catch (error) {
        console.warn("Could not clear saved resume:", error);
    }

    $("#resetModal").hidden = true;

    showTab(0);
    updatePreview();

    $("#saveStatus").textContent = "Ready to create";

    toast("Resume reset successfully.");
});

// ==================== PDF DOWNLOAD ====================

function downloadPDF() {
    updatePreview();

    toast("Choose Save as PDF in the print window.");

    setTimeout(() => window.print(), 150);
}

$("#downloadBtn").addEventListener("click", downloadPDF);
$("#previewDownloadBtn").addEventListener("click", downloadPDF);

// ==================== CURRENT YEAR ====================

$("#currentYear").textContent = new Date().getFullYear();

// ==================== INITIALIZE APP ====================

const restored = loadData();

showTab(0);
setZoom(1);
updatePreview();

$("#saveStatus").textContent = restored
    ? "Resume restored"
    : "Ready to create";


});