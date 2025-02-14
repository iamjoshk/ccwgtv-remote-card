import { LitElement, html, css } from 'https://unpkg.com/lit-element@2.5.1/lit-element.js?module';

window.customCards = window.customCards || [];
window.customCards.push({
    type: "ccwgtv-remote-card",
    name: "CCwGTV Remote Card",
    description: "A custom remote control for CCwGTV",
    preview: true, // Optional: Enables a preview in the card picker
});

class CCwGTVRemoteCard extends LitElement {
    constructor() {
        super();
        this.styleElement = document.createElement('style');
        this.applyStyles(); // Apply styles during construction

        this.buttonPressState = {}; // Track state for each button's fading effect
    }

    applyStyles() {
        this.styleElement.textContent = `
            .card {
                position: relative;
                background: transparent;
                box-shadow: none;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .title {
                margin: 10px auto;
                padding: 5px;
                font-size: 14px;
                text-align: center;
                background-color: #eeeeee;
                border-radius: 10px;
                display: inline-block;
                width: fit-content;
            }

            .content {
                padding: 5px;
                position: relative;
                display: flex !important;
                justify-content: center; /* Center the canvas horizontally */
                align-items: center; /* Center the canvas vertically */
            }

            .canvas {
                background: transparent; /* Keep canvas background transparent */
            }

            /* Add more styles as needed for buttons, etc. */
        `;
    }

    preloadIcons() {
        this.icons = {};
        const defaultIconPaths = {
            "up": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-up.svg",
            "down": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-down.svg",
            "left": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-left.svg",
            "right": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-right.svg",
            "select": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/circle-small.svg",
            "back": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/arrow-left.svg",
            "assistant": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/google-assistant.svg",
            "home": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/home.svg",
            "volume_mute": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/volume-off.svg",
            "youtube": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/youtube.svg",
            "netflix": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/netflix.svg",
            "power": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/power.svg",
            "input": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/import.svg",
            "volume_down": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/volume-minus.svg",
            "volume_up": "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/volume-plus.svg"
        };

        const iconPaths = { ...defaultIconPaths, ...(this.config.icons || {}) };

        const promises = Object.keys(iconPaths).map(key => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = iconPaths[key];
                img.onload = () => {
                    this.icons[key] = img;
                    resolve();
                };
                img.onerror = reject;
            });
        });

        Promise.all(promises).then(() => {
            if (this.content) {
                this.drawRemoteControl(); // Redraw the remote after icons are loaded
            }
        }).catch(err => {
            console.error("Error loading icons", err);
        });
    }

    // Method to return default configuration (optional)
    static getStubConfig() {
        return {
            title: "CCwGTV Remote",
            scale: 0.87,
            icons: {
                up: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-up.svg",
                down: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-down.svg",
                left: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-left.svg",
                right: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/menu-right.svg",
                select: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/circle-small.svg",
                back: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/arrow-left.svg",
                assistant: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/google-assistant.svg",
                home: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/home.svg",
                volume_mute: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/volume-off.svg",
                youtube: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/youtube.svg",
                netflix: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/netflix.svg",
                power: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/power.svg",
                input: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/import.svg",
                volume_down: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/volume-minus.svg",
                volume_up: "https://cdn.jsdelivr.net/npm/@mdi/svg/svg/volume-plus.svg"
            },
            layout_options: {
                grid_columns: 2,
                grid_rows: 6
            }
        };
    }

    setConfig(config) {
        this.config = config;
        
		// Set default scale to 0.87 if not provided, and clamp it between 0.5 and 1.5
		this.scale = Math.max(0.5, Math.min(this.config.scale || 0.87, 1.5));

        if (!this.content) {
            const card = document.createElement('ha-card');
            card.classList.add('card');

            if (this.config.title) {
                const titleElement = document.createElement('h2');
                titleElement.classList.add('title');
                titleElement.innerText = this.config.title;
                card.appendChild(titleElement);
            }

            this.content = document.createElement('div');
            this.content.classList.add('content');
            card.appendChild(this.content);
            this.shadowRoot.appendChild(card);

            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas.bind(this));
        }

        this.content.innerHTML = '';
        this.buttonRegions = [];
        this.preloadIcons(); // Preload icons after config is set
        this.drawRemoteControl();
    }

    resizeCanvas() {
        const canvas = this.content.querySelector('#remoteCanvas');
        if (canvas) {
            const parentWidth = this.content.clientWidth;
            const parentHeight = this.content.clientHeight;

            const defaultWidth = 216;
            const defaultHeight = 720;
            canvas.width = (parentWidth || defaultWidth) * this.scale;
            canvas.height = (parentHeight || defaultHeight) * this.scale;

            this.drawRemoteControl();
        }
    }

    handleButtonPress(action, buttonIndex) {
        if (this.config && this.config[action]) {
            console.log(`Button pressed: ${action}`);
            this._hass.callService(this.config[action].domain, this.config[action].service, this.config[action].service_data || {});

            // Trigger haptic feedback
            this.fireHaptic('light');

            // Trigger fading effect for the clicked button
            this.triggerButtonFade(buttonIndex);
        }
    }

    // Trigger haptic feedback
    fireHaptic(type) {
        const event = new Event('haptic');
        event.detail = type;
        window.dispatchEvent(event);
    }

    // Trigger fading effect on a button
    triggerButtonFade(buttonIndex) {
        this.buttonPressState[buttonIndex] = { opacity: 1.0 }; // Start with full opacity
        this.animateFade(buttonIndex); // Start fading animation
    }

    // Animate the button fade effect
    animateFade(buttonIndex) {
        const fadeDuration = 250; // Duration of fade in milliseconds
        const fadeSteps = 30; // Number of animation steps
        const stepDuration = fadeDuration / fadeSteps;

        const fadeStep = () => {
            if (!this.buttonPressState[buttonIndex]) return;

            this.buttonPressState[buttonIndex].opacity -= 1 / fadeSteps; // Decrease opacity
            if (this.buttonPressState[buttonIndex].opacity <= 0) {
                delete this.buttonPressState[buttonIndex]; // Remove state when fully faded
            } else {
                setTimeout(fadeStep, stepDuration);
            }
            this.drawRemoteControl(); // Redraw the remote at each step
        };

        fadeStep();
    }

    drawRemoteControl() {
		// Create the canvas element with dynamic sizing
		this.content.innerHTML = `<canvas id="remoteCanvas"></canvas>`;
		const canvas = this.content.querySelector('#remoteCanvas');

        const bodyWidth = 216 * this.scale;
        const bodyHeight = bodyWidth * 10 / 3;
		
		// Set canvas width and height to match the remote's dimensions
		canvas.width = bodyWidth;
		canvas.height = bodyHeight;
        const ctx = canvas.getContext('2d');

        canvas.style.background = 'transparent';
        const remoteBodyColor = "#eeeeee";
        const buttonColor = "#dddddd";
        const dpadColor = "#cccccc";
        const googleAssistantColor = "#555555";


        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        this.buttonRegions = [];

        const drawRemoteBody = () => {
            ctx.fillStyle = remoteBodyColor;
            ctx.beginPath();
            ctx.roundRect(centerX - bodyWidth / 2, centerY - bodyHeight / 2, bodyWidth, bodyHeight, bodyWidth * 11 / 24);
            ctx.fill();
        };

        const drawButton = (x, y, radius, color, iconKey, action, buttonIndex) => {
            const opacity = this.buttonPressState[buttonIndex]?.opacity || 1.0;
            ctx.globalAlpha = opacity; // Set button opacity
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            if (iconKey && this.icons[iconKey]) {
                ctx.drawImage(this.icons[iconKey], x - radius / 2, y - radius / 2, radius, radius);
            }

            ctx.globalAlpha = 1.0; // Reset opacity

           // Store button region for click detection and hover effect (for round buttons)
            this.buttonRegions.push({ type: 'circle', x, y, radius, action });
        };

		const drawVolumeButton = (x, y, width, height, iconKey, action, buttonIndex, isLeft) => {
			const opacity = this.buttonPressState[buttonIndex]?.opacity || 1.0;
			ctx.globalAlpha = opacity; // Set button opacity
			ctx.fillStyle = buttonColor;

			// Determine corner radii: rounded only on the outer side
			const borderRadius = isLeft ? { tl: height / 2, tr: 0, br: 0, bl: height / 2 } 
										: { tl: 0, tr: height / 2, br: height / 2, bl: 0 };

			// Draw button with rounded corners on one side
			ctx.beginPath();
			ctx.roundRect(x, y, width, height, [borderRadius.tl, borderRadius.tr, borderRadius.br, borderRadius.bl]);
			ctx.fill();

			if (iconKey && this.icons[iconKey]) {
				ctx.drawImage(this.icons[iconKey], x + width / 2 - height / 2, y, height, height); // Center icon inside button
			}

			ctx.globalAlpha = 1.0; // Reset opacity

			// Store button region for click detection and hover effect
			this.buttonRegions.push({ type: 'rect', x, y, width, height, action });
		};

        const handleCanvasClick = (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            for (const [index, button] of this.buttonRegions.entries()) {
                if (button.type === 'circle') {
                    const distance = Math.sqrt(Math.pow(mouseX - button.x, 2) + Math.pow(mouseY - button.y, 2));
                    if (distance < button.radius) {
                        this.handleButtonPress(button.action, index);
                        break;
                    }
                } else if (button.type === 'rect') {
                    if (mouseX >= button.x && mouseX <= button.x + button.width &&
                        mouseY >= button.y && mouseY <= button.y + button.height) {
                        this.handleButtonPress(button.action, index);
                        break; // Stop checking after the first match
                    }
                }
            }

        };

        const handleCanvasHover = (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            let isHovering = false;

            // Check if the mouse is hovering over any button
            for (const button of this.buttonRegions) {
                if (button.type === 'circle') {
                    // Circular button hover detection (e.g., D-Pad and other round buttons)
                    const distance = Math.sqrt(Math.pow(mouseX - button.x, 2) + Math.pow(mouseY - button.y, 2));
                    if (distance < button.radius) {
                        isHovering = true;
                        break;
                    }
                } else if (button.type === 'rect') {
                    // Rectangular button hover detection (e.g., Volume Up/Down buttons)
                    if (
                        mouseX >= button.x && mouseX <= button.x + button.width &&
                        mouseY >= button.y && mouseY <= button.y + button.height
                    ) {
                        isHovering = true;
                        break;
                    }
                }
            }

            // Change the cursor to pointer if hovering over a button, otherwise default
            canvas.style.cursor = isHovering ? 'pointer' : 'default';
        };

        canvas.removeEventListener('click', handleCanvasClick);
        canvas.addEventListener('click', handleCanvasClick.bind(this));
		
        canvas.removeEventListener('mousemove', handleCanvasHover); // Remove old hover listener if exists
        canvas.addEventListener('mousemove', handleCanvasHover); // Track mouse movement for hover effect

        // Draw a circle to enclose the D-Pad and one for Center button
        function drawDPadCircle() {
            const dPadRadius = bodyWidth * 9 / 20; // Adjust to ensure all D-Pad buttons fit within the circle
            const dPadCenterY = centerY - bodyHeight * 7 / 20; // Same center as the D-Pad buttons

            ctx.strokeStyle = dpadColor; // Use button color for the D-Pad circle outline
            ctx.lineWidth = 2; // Width of the circle outline
            ctx.beginPath();
            ctx.arc(centerX, dPadCenterY, dPadRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(centerX, dPadCenterY, dPadRadius / 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw D-Pad (Up, Down, Left, Right, Center) and the enclosing circle
        function drawDPad() {
            const buttonRadius = bodyWidth * 17 / 120; // D-Pad buttons
            const dPadCenterY = centerY - bodyHeight * 7 / 20; // Y position for D-Pad center

            // Draw the enclosing circle first
            drawDPadCircle();

            // Draw D-Pad buttons
            // Up
            drawButton(centerX, dPadCenterY - bodyHeight * 9 / 100, buttonRadius, remoteBodyColor, "up", "up", 0);

            // Down
            drawButton(centerX, dPadCenterY + bodyHeight * 9 / 100, buttonRadius, remoteBodyColor, "down", "down", 1);

            // Left
            drawButton(centerX - bodyWidth * 3 / 10, dPadCenterY, buttonRadius, remoteBodyColor, "left", "left", 2);

            // Right
            drawButton(centerX + bodyWidth * 3 / 10, dPadCenterY, buttonRadius, remoteBodyColor, "right", "right", 3);

            // Select (middle of D-Pad)
            drawButton(centerX, dPadCenterY, buttonRadius, remoteBodyColor, "select", "select", 4);
        }

        // Draw Home, Back, Google Assistant, Mute, YouTube, and Netflix buttons
        function drawControlButtons() {
            const buttonRadius = bodyWidth / 6; // Control buttons radius
            const yOffset = - bodyHeight * 5 / 40; // Y-offset for position adjustment

            // Back button (top-left)
            drawButton(centerX - bodyWidth / 4, centerY + yOffset, buttonRadius, buttonColor, "back", "back", 5);

            // Google Assistant button (right of Back button)
            drawButton(centerX + bodyWidth / 4, centerY + yOffset, buttonRadius, googleAssistantColor, "assistant", "assistant", 6);

            // Home button (below Back button)
            drawButton(centerX - bodyWidth / 4, centerY + yOffset + bodyHeight / 8, buttonRadius, buttonColor, "home", "home", 7);

            // Mute button (below Google Assistant, right of Home)
            drawButton(centerX + bodyWidth / 4, centerY + yOffset + bodyHeight / 8, buttonRadius, buttonColor, "volume_mute", "volume_mute", 8);

            // YouTube button (below Home)
            drawButton(centerX - bodyWidth / 4, centerY + yOffset + bodyHeight / 4, buttonRadius, buttonColor, "youtube", "youtube", 9);

            // Netflix button (below Mute)
            drawButton(centerX + bodyWidth / 4, centerY + yOffset + bodyHeight / 4, buttonRadius, buttonColor, "netflix", "netflix", 10);
        }

        // Draw Power and Source buttons (smallest)
        function drawPowerButtons() {
            const buttonRadius = bodyWidth / 10; // Smallest buttons
            const yOffset = bodyHeight * 11 / 50; // Adjust Y position

            // Enclosing rectangle dimensions
            const enclosingWidth = bodyWidth * 43 / 60;
            const enclosingHeight = bodyHeight * 13 / 200;

            // Draw enclosing rounded rectangle for Power/Input
            ctx.beginPath();
            ctx.roundRect(centerX - bodyWidth * 43 / 120, centerY + yOffset, enclosingWidth, enclosingHeight, bodyWidth / 6); // rounded edges
            ctx.strokeStyle = dpadColor; // Optional: outline the enclosure with a light gray color
            ctx.lineWidth = 2;
            ctx.stroke();

            // Power button (bottom-left)
            drawButton(centerX - bodyWidth / 4, centerY + yOffset + bodyHeight * 13 / 400, buttonRadius, buttonColor, "power", "power", 11);

            // Source/Input button (bottom-right)
            drawButton(centerX + bodyWidth / 4, centerY + yOffset + bodyHeight * 13 / 400, buttonRadius, buttonColor, "input", "input", 12);
        }

		function drawVolumeButtons() {
			const volumeWidth = bodyWidth / 3;
			const volumeHeight = bodyHeight * 3 / 80;
			const yOffset = bodyHeight * 15 / 40; // Adjust Y position

			// Volume down (left rectangle with rounded left side)
			drawVolumeButton(centerX - volumeWidth - bodyWidth / 144, centerY + yOffset, volumeWidth, volumeHeight, "volume_down", "volume_down", 13, true);

			// Volume up (right rectangle with rounded right side)
			drawVolumeButton(centerX + bodyWidth / 144, centerY + yOffset, volumeWidth, volumeHeight, "volume_up", "volume_up", 14, false);
		}
		
        drawRemoteBody();
        drawDPad(); // Draws D-Pad and enclosing circle
        drawControlButtons(); // Handles Back, Home, Google Assistant, Mute, YouTube, Netflix buttons
        drawPowerButtons(); // Handles Power and Source buttons
        drawVolumeButtons(); // Handles Volume up/down buttons

    }

    set hass(hass) {
        this._hass = hass;
        if (this.content) {
            this.drawRemoteControl(); // Redraw the remote when Home Assistant data changes
        }
    }

    static get layoutOptions() {
        return {
            'grid-width': 2,
            'grid-height': 6
        };
    }

    static getConfigElement() {
        return document.createElement('ccwgtv-remote-card-editor');
    }
}

class CCwGTVRemoteCardEditor extends LitElement {
    setConfig(config) {
        this._config = config;
        this.requestUpdate();
    }

    get _icons() {
        return this._config?.icons || {};
    }

    configChanged(ev) {
        if (!this._config) return;
        
        const target = ev.target;
        if (target.configValue) {
            if (target.configValue.includes('.')) {
                // Handle nested properties (for icons)
                const [parent, child] = target.configValue.split('.');
                this._config[parent] = this._config[parent] || {};
                this._config[parent][child] = target.value;
            } else {
                this._config[target.configValue] = target.value;
            }
        }
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
    }

    render() {
        if (!this._config) {
            return html``;
        } else {
            return html`
                <div class="card-config">
                    <div>
                        <h4>Up Icon URL</h4>
                        <ha-textfield
                            label="Up Icon URL"
                            .value="${this._icons.up || ''}"
                            .configValue=${'icons.up'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Down Icon URL</h4>
                        <ha-textfield
                            label="Down Icon URL"
                            .value="${this._icons.down || ''}"
                            .configValue=${'icons.down'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Left Icon URL</h4>
                        <ha-textfield
                            label="Left Icon URL"
                            .value="${this._icons.left || ''}"
                            .configValue=${'icons.left'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Right Icon URL</h4>
                        <ha-textfield
                            label="Right Icon URL"
                            .value="${this._icons.right || ''}"
                            .configValue=${'icons.right'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Select Icon URL</h4>
                        <ha-textfield
                            label="Select Icon URL"
                            .value="${this._icons.select || ''}"
                            .configValue=${'icons.select'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Back Icon URL</h4>
                        <ha-textfield
                            label="Back Icon URL"
                            .value="${this._icons.back || ''}"
                            .configValue=${'icons.back'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Assistant Icon URL</h4>
                        <ha-textfield
                            label="Assistant Icon URL"
                            .value="${this._icons.assistant || ''}"
                            .configValue=${'icons.assistant'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Home Icon URL</h4>
                        <ha-textfield
                            label="Home Icon URL"
                            .value="${this._icons.home || ''}"
                            .configValue=${'icons.home'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Volume Mute Icon URL</h4>
                        <ha-textfield
                            label="Volume Mute Icon URL"
                            .value="${this._icons.volume_mute || ''}"
                            .configValue=${'icons.volume_mute'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Netflix Icon URL</h4>
                        <ha-textfield
                            label="Netflix Icon URL"
                            .value="${this._icons.netflix || ''}"
                            .configValue=${'icons.netflix'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>YouTube Icon URL</h4>
                        <ha-textfield
                            label="YouTube Icon URL"
                            .value="${this._icons.youtube || ''}"
                            .configValue=${'icons.youtube'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Power Icon URL</h4>
                        <ha-textfield
                            label="Power Icon URL"
                            .value="${this._icons.power || ''}"
                            .configValue=${'icons.power'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Input Icon URL</h4>
                        <ha-textfield
                            label="Input Icon URL"
                            .value="${this._icons.input || ''}"
                            .configValue=${'icons.input'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Volume Down Icon URL</h4>
                        <ha-textfield
                            label="Volume Down Icon URL"
                            .value="${this._icons.volume_down || ''}"
                            .configValue=${'icons.volume_down'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                    <div>
                        <h4>Volume Up Icon URL</h4>
                        <ha-textfield
                            label="Volume Up Icon URL"
                            .value="${this._icons.volume_up || ''}"
                            .configValue=${'icons.volume_up'}
                            @input="${this.configChanged}"
                        ></ha-textfield>
                    </div>
                </div>
            `;
        }
    }
}

customElements.define('ccwgtv-remote-card-editor', CCwGTVRemoteCardEditor);
customElements.define('ccwgtv-remote-card', CCwGTVRemoteCard);
