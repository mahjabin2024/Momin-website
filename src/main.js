import { WebContainer } from '@webcontainer/api';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

class CustomHydrationPlatform {
    constructor() {
        this.webcontainer = null;
        this.terminal = null;
        this.fitAddon = null;
        this.isIdeOpen = false;
        this.currentTab = 'editor';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavigation();
        await this.initializeWebContainer();
        this.setupTerminalPreview();
    }

    setupEventListeners() {
        // IDE Modal
        window.openIDE = () => this.openIDE();
        window.closeIDE = () => this.closeIDE();
        window.scrollToProducts = () => this.scrollToProducts();

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }



        // Smooth scrolling for navigation (combined with mobile menu close)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Close mobile menu
                navLinks.classList.remove('active');
                if (mobileToggle) mobileToggle.classList.remove('active');

                // Smooth scroll to target
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Close IDE on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isIdeOpen) {
                this.closeIDE();
            }
        });
    }

    setupNavigation() {
        // Update active nav link on scroll
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    async initializeWebContainer() {
        try {
            console.log('Initializing WebContainer...');
            this.webcontainer = await WebContainer.boot();
            console.log('WebContainer initialized successfully');

            // Mount basic file system
            await this.webcontainer.mount({
                'package.json': {
                    file: {
                        contents: JSON.stringify({
                            name: 'custom-hydration-project',
                            version: '1.0.0',
                            scripts: {
                                dev: 'echo "Development server starting..." && python3 -m http.server 8000',
                                build: 'echo "Building project..."',
                                test: 'echo "Running tests..."'
                            }
                        }, null, 2)
                    }
                },
                'index.html': {
                    file: {
                        contents: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>CustomHydration Project</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 CustomHydration Development Environment</h1>
        <div class="status">
            <h3>✅ WebContainer is running!</h3>
            <p>Your development environment is ready. You can now:</p>
            <ul>
                <li>Edit files in the editor</li>
                <li>Run commands in the terminal</li>
                <li>See live preview of your changes</li>
            </ul>
        </div>
        <p>Start building your custom hydration products with our integrated development platform.</p>
    </div>
</body>
</html>`
                    }
                },
                'README.md': {
                    file: {
                        contents: `# CustomHydration Development Platform

Welcome to your development environment!

## Available Commands

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests

## Getting Started

1. Edit files in the editor
2. Use the terminal to run commands
3. Preview your changes in real-time

Happy coding! 🚀`
                    }
                }
            });

            console.log('File system mounted successfully');
        } catch (error) {
            console.error('Failed to initialize WebContainer:', error);
        }
    }

    setupTerminalPreview() {
        const previewElement = document.getElementById('terminal-preview');
        if (previewElement) {
            // Simulate typing effect
            const commands = [
                '$ npm run dev',
                '> Starting development server...',
                '> WebContainer initialized ✓',
                '> Server running at http://localhost:3000',
                '> Ready for development! 🚀'
            ];

            let commandIndex = 0;
            const typeCommand = () => {
                if (commandIndex < commands.length) {
                    const command = commands[commandIndex];
                    previewElement.innerHTML += command + '\n';
                    commandIndex++;
                    setTimeout(typeCommand, 1000);
                }
            };

            setTimeout(() => {
                previewElement.innerHTML = '';
                typeCommand();
            }, 2000);
        }
    }

    async openIDE() {
        const modal = document.getElementById('ide-modal');
        modal.classList.add('active');
        this.isIdeOpen = true;

        // Initialize terminal if not already done
        if (!this.terminal) {
            await this.initializeTerminal();
        }

        // Initialize file tree
        this.updateFileTree();

        // Fit terminal to container
        if (this.fitAddon) {
            setTimeout(() => {
                this.fitAddon.fit();
            }, 100);
        }
    }

    closeIDE() {
        const modal = document.getElementById('ide-modal');
        modal.classList.remove('active');
        this.isIdeOpen = false;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Fit terminal when switching to terminal tab
        if (tabName === 'terminal' && this.fitAddon) {
            setTimeout(() => {
                this.fitAddon.fit();
            }, 100);
        }
    }

    async initializeTerminal() {
        if (!this.webcontainer) {
            console.error('WebContainer not initialized');
            return;
        }

        const terminalElement = document.getElementById('terminal');
        if (!terminalElement) return;

        this.terminal = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#1a1a2e',
                foreground: '#ffffff',
                cursor: '#00ff88',
                selection: 'rgba(255, 255, 255, 0.3)'
            },
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, monospace'
        });

        this.fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(webLinksAddon);

        this.terminal.open(terminalElement);
        this.fitAddon.fit();

        // Start shell process
        const shellProcess = await this.webcontainer.spawn('bash', {
            terminal: {
                cols: this.terminal.cols,
                rows: this.terminal.rows,
            },
        });

        const self = this;
        shellProcess.output.pipeTo(
            new WritableStream({
                write(data) {
                    self.terminal.write(data);
                }
            })
        );

        const input = shellProcess.input.getWriter();
        this.terminal.onData((data) => {
            input.write(data);
        });

        // Welcome message
        this.terminal.writeln('Welcome to CustomHydration Development Platform! 🚀');
        this.terminal.writeln('WebContainer is ready. Try running: npm run dev');
        this.terminal.writeln('');
    }

    async updateFileTree() {
        const fileTreeElement = document.getElementById('file-tree');
        if (!fileTreeElement || !this.webcontainer) return;

        try {
            const files = await this.webcontainer.fs.readdir('.');
            fileTreeElement.innerHTML = '';

            files.forEach(file => {
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item';
                fileElement.textContent = file;
                fileElement.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background-color 0.2s ease;
                    color: var(--text-secondary);
                `;

                fileElement.addEventListener('mouseenter', () => {
                    fileElement.style.backgroundColor = 'var(--surface-hover)';
                });

                fileElement.addEventListener('mouseleave', () => {
                    fileElement.style.backgroundColor = 'transparent';
                });

                fileElement.addEventListener('click', () => {
                    this.openFile(file);
                });

                fileTreeElement.appendChild(fileElement);
            });
        } catch (error) {
            console.error('Failed to read directory:', error);
        }
    }

    async openFile(filename) {
        if (!this.webcontainer) return;

        try {
            const content = await this.webcontainer.fs.readFile(filename, 'utf-8');
            const editor = document.getElementById('code-editor');
            if (editor) {
                editor.value = content;
                editor.dataset.filename = filename;
            }

            // Switch to editor tab
            this.switchTab('editor');
        } catch (error) {
            console.error('Failed to read file:', error);
        }
    }

    scrollToProducts() {
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize the platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CustomHydrationPlatform();
});

// Handle responsive navigation
window.addEventListener('resize', () => {
    const navLinks = document.querySelector('.nav-links');
    if (window.innerWidth > 768) {
        navLinks.classList.remove('active');
    }
});
