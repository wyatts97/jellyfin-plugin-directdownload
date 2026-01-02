// Modal component for Direct Download plugin
// Provides reusable modal functionality

(function(DirectDownload) {
    'use strict';
    
    DirectDownload.components.Modal = {
        // Active modals
        activeModals: new Set(),
        
        // Modal counter for unique IDs
        modalCounter: 0,
        
        // Initialize modal system
        init: function() {
            this.setupGlobalHandlers();
            this.addModalStyles();
        },
        
        // Setup global event handlers
        setupGlobalHandlers: function() {
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModals.size > 0) {
                    const topModal = this.getTopModal();
                    if (topModal) {
                        this.close(topModal);
                    }
                }
            });
            
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('direct-download-modal-overlay')) {
                    this.close(e.target.closest('.direct-download-modal'));
                }
            });
        },
        
        // Create a new modal
        create: function(title, content, options = {}) {
            const modalId = 'direct-download-modal-' + (++this.modalCounter);
            
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'direct-download-modal';
            modal.innerHTML = `
                <div class="direct-download-modal-overlay"></div>
                <div class="direct-download-modal-dialog ${options.size || 'medium'}">
                    <div class="direct-download-modal-header">
                        <h2 class="modal-title">${this.escapeHtml(title)}</h2>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="direct-download-modal-body">
                        ${content}
                    </div>
                    ${options.footer ? `
                    <div class="direct-download-modal-footer">
                        ${options.footer}
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Add to page
            document.body.appendChild(modal);
            
            // Setup modal handlers
            this.setupModalHandlers(modal);
            
            // Add to active modals
            this.activeModals.add(modal);
            
            // Show modal with animation
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
            
            // Focus management
            this.manageFocus(modal);
            
            return modal;
        },
        
        // Setup modal event handlers
        setupModalHandlers: function(modal) {
            // Close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.close(modal);
                });
            }
            
            // Form submission handling
            const form = modal.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit(modal, form);
                });
            }
        },
        
        // Close modal
        close: function(modal) {
            if (!modal || !this.activeModals.has(modal)) {
                return;
            }
            
            // Add closing animation
            modal.classList.add('closing');
            
            // Remove after animation
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                this.activeModals.delete(modal);
                
                // Return focus to previous element
                this.restoreFocus();
            }, 300);
        },
        
        // Close all modals
        closeAll: function() {
            const modals = Array.from(this.activeModals);
            modals.forEach(modal => this.close(modal));
        },
        
        // Get top modal
        getTopModal: function() {
            const modals = Array.from(this.activeModals);
            return modals[modals.length - 1] || null;
        },
        
        // Handle form submission
        handleFormSubmit: function(modal, form) {
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Trigger custom event
            const event = new CustomEvent('modalSubmit', {
                detail: { modal, form, data }
            });
            modal.dispatchEvent(event);
        },
        
        // Focus management
        manageFocus: function(modal) {
            // Store current focus
            this.previousFocus = document.activeElement;
            
            // Focus first focusable element
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
            
            // Trap focus within modal
            this.trapFocus(modal);
        },
        
        // Restore focus
        restoreFocus: function() {
            if (this.previousFocus && this.previousFocus.focus) {
                this.previousFocus.focus();
            }
        },
        
        // Trap focus within modal
        trapFocus: function(modal) {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        // Tab
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        },
        
        // Show confirmation modal
        confirm: function(message, options = {}) {
            return new Promise((resolve) => {
                const modal = this.create(
                    options.title || 'Confirm',
                    `
                    <div class="confirm-content">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    `,
                    {
                        size: 'small',
                        footer: `
                            <button class="confirm-cancel secondary-btn">${options.cancelText || 'Cancel'}</button>
                            <button class="confirm-ok primary-btn">${options.confirmText || 'OK'}</button>
                        `
                    }
                );
                
                // Setup button handlers
                modal.querySelector('.confirm-ok').addEventListener('click', () => {
                    this.close(modal);
                    resolve(true);
                });
                
                modal.querySelector('.confirm-cancel').addEventListener('click', () => {
                    this.close(modal);
                    resolve(false);
                });
                
                // Close on overlay click cancels by default
                modal.querySelector('.direct-download-modal-overlay').addEventListener('click', () => {
                    this.close(modal);
                    resolve(false);
                });
            });
        },
        
        // Show alert modal
        alert: function(message, options = {}) {
            return new Promise((resolve) => {
                const modal = this.create(
                    options.title || 'Alert',
                    `
                    <div class="alert-content">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    `,
                    {
                        size: 'small',
                        footer: `
                            <button class="alert-ok primary-btn">${options.buttonText || 'OK'}</button>
                        `
                    }
                );
                
                // Setup button handler
                modal.querySelector('.alert-ok').addEventListener('click', () => {
                    this.close(modal);
                    resolve();
                });
            });
        },
        
        // Show loading modal
        loading: function(message = 'Loading...', options = {}) {
            const modal = this.create(
                options.title || 'Please Wait',
                `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>${this.escapeHtml(message)}</p>
                </div>
                `,
                {
                    size: 'small',
                    closable: false
                }
            );
            
            return {
                modal: modal,
                close: () => this.close(modal),
                updateMessage: (newMessage) => {
                    const messageElement = modal.querySelector('.loading-content p');
                    if (messageElement) {
                        messageElement.textContent = newMessage;
                    }
                }
            };
        },
        
        // Add modal styles
        addModalStyles: function() {
            if (document.querySelector('#direct-download-modal-styles')) {
                return;
            }
            
            const style = document.createElement('style');
            style.id = 'direct-download-modal-styles';
            style.textContent = `
                .direct-download-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                
                .direct-download-modal.show {
                    opacity: 1;
                    visibility: visible;
                }
                
                .direct-download-modal.closing {
                    opacity: 0;
                    visibility: hidden;
                }
                
                .direct-download-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                }
                
                .direct-download-modal-dialog {
                    position: relative;
                    background: #242424;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    max-height: 90vh;
                    overflow: hidden;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .direct-download-modal.show .direct-download-modal-dialog {
                    transform: scale(1);
                }
                
                .direct-download-modal-dialog.small {
                    width: 90%;
                    max-width: 400px;
                }
                
                .direct-download-modal-dialog.medium {
                    width: 90%;
                    max-width: 600px;
                }
                
                .direct-download-modal-dialog.large {
                    width: 90%;
                    max-width: 900px;
                }
                
                .direct-download-modal-dialog.fullscreen {
                    width: 95%;
                    max-width: none;
                    height: 95%;
                    max-height: none;
                }
                
                .direct-download-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #333;
                    background: #1a1a1a;
                }
                
                .modal-title {
                    margin: 0;
                    color: #fff;
                    font-size: 1.25rem;
                    font-weight: 500;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    color: #ccc;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                
                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                
                .direct-download-modal-body {
                    padding: 24px;
                    color: #fff;
                    overflow-y: auto;
                    max-height: calc(90vh - 140px);
                }
                
                .direct-download-modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #333;
                    background: #1a1a1a;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                
                .primary-btn {
                    background: #00a4dc;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s ease;
                }
                
                .primary-btn:hover {
                    background: #0089b8;
                }
                
                .secondary-btn {
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s ease;
                }
                
                .secondary-btn:hover {
                    background: #444;
                }
                
                .loading-content {
                    text-align: center;
                    padding: 20px;
                    color: #fff;
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #333;
                    border-top: 4px solid #00a4dc;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .confirm-content, .alert-content {
                    text-align: center;
                    padding: 20px;
                    color: #fff;
                }
                
                .confirm-content p, .alert-content p {
                    margin: 0;
                    line-height: 1.5;
                }
            `;
            
            document.head.appendChild(style);
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
})(window.DirectDownload || (window.DirectDownload = {}));
