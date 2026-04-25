/* advanced-features.js */
(() => {
    const TRANSLATIONS = {
        en: {
            title: 'KrishiPro - Crop Profit Optimizer',
            recommendations_title: 'AI Recommendations',
            nav_optimizer: 'Optimizer',
            nav_market: 'Market Prices',
            nav_calculator: 'Calculator',
            nav_weather: 'Weather',
            nav_features: 'Features',
            nav_cta: 'Get Recommendation →',
            mobile_optimizer: '🌱 Crop Optimizer',
            mobile_market: '📈 Market Prices',
            mobile_calculator: '🧮 Profit Calculator',
            mobile_weather: '🌤 Weather Forecast',
            mobile_features: '⚡ Features',
            hero_badge: 'AI-Powered • Real-Time Mandi Data • Weather-Aware',
            hero_subtitle: 'KrishiPro combines machine learning, live mandi prices, and local weather data to recommend the most profitable crops for your specific land and conditions.',
            hero_primary_btn: '🌱 Start Optimizing',
            hero_secondary_btn: '📊 View Market Prices',
            chat_toggle: 'Ask AI',
            chat_title: 'KrishiPro Assistant',
            chat_placeholder: 'Ask about crops, profit, weather',
            chat_send: 'Send',
            chat_voice: 'Voice',
            chat_voice_aria: 'Voice input',
            chat_retry: 'Retry Last Message',
            insights_title: 'Strategy Dashboard',
            insights_sub: 'Live plan based on your latest recommendation run',
            insight_status_awaiting: 'Awaiting Analysis',
            insight_status_live: 'Live Strategy Ready',
            insight_label_best_crop: 'Best Crop',
            insight_label_projected_profit: 'Projected Profit',
            insight_label_roi: 'ROI Potential',
            insight_label_risk: 'Risk Outlook',
            insight_timeline_default: 'Run analysis to generate a smart crop action timeline.',
            sort_by: 'Sort by',
            sort_profit: 'Highest Profit',
            sort_roi: 'Highest ROI',
            sort_risk: 'Lowest Risk',
            sort_confidence: 'Best AI Confidence',
            chat_thinking: 'Thinking...',
            status_ready: 'Status: Ready',
            status_sending: 'Status: Sending...',
            status_live: 'Status: Live',
            status_fallback: 'Status: Fallback response',
            status_rate_limited: 'Status: Rate-limited, fallback response',
            toast_language_updated: 'Language updated',
            toast_voice_unsupported: 'Voice input is not supported in this browser.',
            toast_listening: 'Listening... Speak now.',
            toast_voice_command_executed: 'Command executed',
            toast_retry_unavailable: 'No failed message to retry.',
        },
        hi: {
            title: 'KrishiPro - फसल मुनाफा ऑप्टिमाइज़र',
            recommendations_title: 'AI सिफारिशें',
            nav_optimizer: 'ऑप्टिमाइज़र',
            nav_market: 'मंडी भाव',
            nav_calculator: 'कैलकुलेटर',
            nav_weather: 'मौसम',
            nav_features: 'फीचर्स',
            nav_cta: 'सिफारिश पाएं →',
            mobile_optimizer: '🌱 फसल ऑप्टिमाइज़र',
            mobile_market: '📈 मंडी भाव',
            mobile_calculator: '🧮 लाभ कैलकुलेटर',
            mobile_weather: '🌤 मौसम पूर्वानुमान',
            mobile_features: '⚡ फीचर्स',
            hero_badge: 'AI-पावर्ड • रियल-टाइम मंडी डेटा • मौसम आधारित',
            hero_subtitle: 'KrishiPro मशीन लर्निंग, लाइव मंडी भाव और स्थानीय मौसम डेटा से आपकी जमीन के लिए सबसे लाभदायक फसल सुझाता है।',
            hero_primary_btn: '🌱 अभी शुरू करें',
            hero_secondary_btn: '📊 मंडी भाव देखें',
            chat_toggle: 'AI से पूछें',
            chat_title: 'KrishiPro सहायक',
            chat_placeholder: 'फसल, मुनाफा या मौसम के बारे में पूछें',
            chat_send: 'भेजें',
            chat_voice: 'आवाज़',
            chat_voice_aria: 'आवाज़ इनपुट',
            chat_retry: 'पिछला संदेश फिर भेजें',
            insights_title: 'रणनीति डैशबोर्ड',
            insights_sub: 'आपके नवीनतम विश्लेषण के आधार पर लाइव योजना',
            insight_status_awaiting: 'विश्लेषण की प्रतीक्षा',
            insight_status_live: 'लाइव रणनीति तैयार',
            insight_label_best_crop: 'सर्वश्रेष्ठ फसल',
            insight_label_projected_profit: 'अनुमानित लाभ',
            insight_label_roi: 'ROI क्षमता',
            insight_label_risk: 'जोखिम स्थिति',
            insight_timeline_default: 'स्मार्ट फसल एक्शन टाइमलाइन के लिए विश्लेषण चलाएं।',
            sort_by: 'क्रमबद्ध करें',
            sort_profit: 'सबसे अधिक लाभ',
            sort_roi: 'सबसे अधिक ROI',
            sort_risk: 'सबसे कम जोखिम',
            sort_confidence: 'सबसे बेहतर AI विश्वसनीयता',
            chat_thinking: 'सोच रहा है...',
            status_ready: 'स्थिति: तैयार',
            status_sending: 'स्थिति: भेजा जा रहा है...',
            status_live: 'स्थिति: लाइव',
            status_fallback: 'स्थिति: फॉलबैक उत्तर',
            status_rate_limited: 'स्थिति: अधिक ट्रैफिक, फॉलबैक उत्तर',
            toast_language_updated: 'भाषा अपडेट हुई',
            toast_voice_unsupported: 'इस ब्राउज़र में आवाज़ सुविधा उपलब्ध नहीं है।',
            toast_listening: 'सुन रहे हैं... बोलिए।',
            toast_voice_command_executed: 'कमांड चल गई',
            toast_retry_unavailable: 'रीट्राई के लिए कोई असफल संदेश नहीं मिला।',
        },
    };

    const CHATBOT_RESPONSES = {
        greetings: [
            'Hello. I can help with crop recommendations, pricing, and weather guidance.',
            'Welcome to KrishiPro assistant. Ask me about crop profit planning.',
        ],
        cropQuestions: {
            wheat: 'Wheat performs best in Rabi with medium irrigation and controlled fertilizer cost.',
            rice: 'Rice works better for high-water zones. Keep labor and irrigation planned early.',
            weather: 'Use the 7-day panel for short-term action and combine with district-specific planning.',
            profit: 'Use the calculator and compare top recommendations before final crop selection.',
            compare: 'Use the Compare button on recommendation cards. At least two crops are required.',
        },
    };

    class CropComparison {
        constructor() {
            this.selectedCrops = [];
            this.maxCrops = 4;
        }

        addCrop(cropData) {
            if (!cropData || !cropData.key) return false;

            if (this.selectedCrops.find((crop) => crop.key === cropData.key)) {
                showToast('Crop already added for comparison.', 'warning');
                return false;
            }

            if (this.selectedCrops.length >= this.maxCrops) {
                showToast(`Maximum ${this.maxCrops} crops can be compared.`, 'warning');
                return false;
            }

            this.selectedCrops.push(cropData);
            this.renderComparisonView();
            return true;
        }

        removeCrop(cropKey) {
            this.selectedCrops = this.selectedCrops.filter((crop) => crop.key !== cropKey);
            this.renderComparisonView();
        }

        renderComparisonView() {
            if (this.selectedCrops.length < 2) {
                showToast('Select at least 2 crops for comparison.', 'info');
                this.close();
                return;
            }

            let modal = document.getElementById('comparisonModal');
            if (!modal) {
                this.createComparisonModal();
                modal = document.getElementById('comparisonModal');
            }

            const tags = document.getElementById('comparisonCropTags');
            const head = document.getElementById('comparisonTableHead');
            const tbody = document.getElementById('comparisonTableBody');
            if (!tags || !head || !tbody) return;

            tags.innerHTML = this.selectedCrops
                .map((crop) => `
                    <div class="comparison-crop-tag">
                        ${crop.emoji || 'Crop'} ${crop.name}
                        <button class="remove-crop" onclick="cropComparison.removeCrop('${crop.key}')">x</button>
                    </div>
                `)
                .join('');

            head.innerHTML = `<th>Metric</th>${this.selectedCrops.map((crop) => `<th>${crop.emoji || ''} ${crop.name}</th>`).join('')}`;

            const metrics = ['expected_profit', 'roi', 'risk_level', 'expected_yield_qtl', 'market_price_per_qtl'];
            const labels = ['Profit (INR)', 'ROI (%)', 'Risk', 'Yield (Qtl)', 'Price (INR/Qtl)'];

            tbody.innerHTML = metrics
                .map((metric, idx) => {
                    const cells = this.selectedCrops
                        .map((crop) => {
                            const value = crop[metric]
                                ?? (metric === 'expected_profit' ? crop.profit : undefined)
                                ?? (metric === 'risk_level' ? crop.risk : undefined)
                                ?? (metric === 'expected_yield_qtl' ? crop.yieldQtl : undefined)
                                ?? (metric === 'market_price_per_qtl' ? crop.price : undefined)
                                ?? (metric === 'roi' ? ((crop.profit && crop.cost) ? (crop.profit / Math.max(crop.cost, 1)) * 100 : 0) : undefined);
                            if (metric === 'expected_profit' || metric === 'market_price_per_qtl') {
                                return `<td>INR ${Math.round(value || 0).toLocaleString('en-IN')}</td>`;
                            }
                            if (metric === 'expected_yield_qtl') {
                                return `<td>${Math.round(value || 0)}</td>`;
                            }
                            if (metric === 'roi') {
                                return `<td>${Number(value || 0).toFixed(1)}</td>`;
                            }
                            return `<td>${value || 'NA'}</td>`;
                        })
                        .join('');
                    return `<tr><td class="metric-label">${labels[idx]}</td>${cells}</tr>`;
                })
                .join('');

            modal.classList.add('show');
        }

        createComparisonModal() {
            const modal = document.createElement('div');
            modal.id = 'comparisonModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="comparison-modal">
                    <div class="modal-header">
                        <h3>Crop Comparison</h3>
                        <button class="modal-close" onclick="cropComparison.close()">x</button>
                    </div>
                    <div class="modal-body">
                        <div class="comparison-crops" id="comparisonCropTags"></div>
                        <table class="comparison-table">
                            <thead>
                                <tr id="comparisonTableHead"></tr>
                            </thead>
                            <tbody id="comparisonTableBody"></tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="result-action-btn" onclick="cropComparison.exportComparison()">Export CSV</button>
                        <button class="btn-primary" onclick="cropComparison.close()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        close() {
            document.getElementById('comparisonModal')?.classList.remove('show');
        }

        exportComparison() {
            if (!window.reportExporter) return;
            window.reportExporter.exportExcel({ recommendations: this.selectedCrops });
        }
    }

    class LanguageManager {
        constructor() {
            this.supportedLanguages = new Set(['en', 'hi']);
            const savedLang = localStorage.getItem('language') || 'en';
            this.currentLang = this.supportedLanguages.has(savedLang) ? savedLang : 'en';
            this.translations = TRANSLATIONS;
        }

        text(key, fallback = '') {
            const bucket = this.translations[this.currentLang] || this.translations.en || {};
            return bucket[key] || fallback || key;
        }

        setLanguage(lang) {
            if (!this.supportedLanguages.has(lang) || !this.translations[lang]) {
                return;
            }
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            this.updateUI();
            showToast(`${this.text('toast_language_updated', 'Language updated')}: ${lang.toUpperCase()}`, 'success');
        }

        updateUI() {
            const t = this.translations[this.currentLang];
            if (!t) return;

            const map = {
                navLinkOptimizer: 'nav_optimizer',
                navLinkMarket: 'nav_market',
                navLinkCalculator: 'nav_calculator',
                navLinkWeather: 'nav_weather',
                navLinkFeatures: 'nav_features',
                navCtaBtn: 'nav_cta',
                mobileNavOptimizer: 'mobile_optimizer',
                mobileNavMarket: 'mobile_market',
                mobileNavCalculator: 'mobile_calculator',
                mobileNavWeather: 'mobile_weather',
                mobileNavFeatures: 'mobile_features',
                heroBadgeText: 'hero_badge',
                heroSubtitle: 'hero_subtitle',
                heroPrimaryBtn: 'hero_primary_btn',
                heroSecondaryBtn: 'hero_secondary_btn',
                chatToggle: 'chat_toggle',
                chatTitle: 'chat_title',
                chatSendBtn: 'chat_send',
                chatRetryBtn: 'chat_retry',
            };

            Object.entries(map).forEach(([id, key]) => {
                const el = document.getElementById(id);
                if (el && t[key]) {
                    el.textContent = t[key];
                }
            });

            document.querySelectorAll('[data-i18n]').forEach((el) => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });

            const chatInput = document.getElementById('chatInput');
            if (chatInput && t.chat_placeholder) {
                chatInput.placeholder = t.chat_placeholder;
            }

            const chatVoiceText = document.getElementById('chatVoiceText');
            if (chatVoiceText && t.chat_voice) {
                chatVoiceText.textContent = t.chat_voice;
            }

            const chatVoiceBtn = document.getElementById('chatVoiceBtn');
            if (chatVoiceBtn) {
                const voiceAria = t.chat_voice_aria || t.chat_voice || 'Voice input';
                chatVoiceBtn.setAttribute('aria-label', voiceAria);
                chatVoiceBtn.setAttribute('title', voiceAria);
            }

            const languageSelect = document.getElementById('languageSelect');
            if (languageSelect) {
                const optionLabelMap = { en: 'English', hi: 'हिंदी' };
                Array.from(languageSelect.options).forEach((opt) => {
                    if (optionLabelMap[opt.value]) opt.textContent = optionLabelMap[opt.value];
                });
            }

            document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });

            if (t.title) document.title = t.title;

            document.documentElement.lang = this.currentLang === 'hi' ? 'hi' : 'en';

            const select = document.getElementById('languageSelect');
            if (select) select.value = this.currentLang;

            if (window.chatbot && typeof window.chatbot.refreshLanguage === 'function') {
                window.chatbot.refreshLanguage();
            }

            if (window.voiceInput && typeof window.voiceInput.updateVoiceButton === 'function') {
                window.voiceInput.updateVoiceButton();
            }
        }
    }

    class VoiceInput {
        constructor() {
            this.recognition = null;
            this.isListening = false;
            this.baseInputText = '';
            this.finalTranscript = '';
            this.initSpeechRecognition();
        }

        initSpeechRecognition() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.updateRecognitionLanguage();

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton();
            };

            this.recognition.onresult = (event) => {
                const input = document.getElementById('chatInput');
                if (!input) return;

                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i += 1) {
                    const result = event.results[i];
                    const spoken = result?.[0]?.transcript || '';
                    if (result.isFinal) {
                        this.finalTranscript += `${spoken} `;
                    } else {
                        interimTranscript += spoken;
                    }
                }

                const merged = `${this.baseInputText} ${this.finalTranscript}${interimTranscript}`
                    .replace(/\s+/g, ' ')
                    .trim();

                input.value = merged;
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            };

            this.recognition.onerror = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        }

        toggle() {
            if (!this.recognition) {
                showToast(window.languageManager?.text('toast_voice_unsupported', 'Voice input is not supported in this browser.') || 'Voice input is not supported in this browser.', 'error');
                return;
            }
            if (this.isListening) {
                this.stop();
            } else {
                this.start();
            }
        }

        start() {
            try {
                const input = document.getElementById('chatInput');
                this.baseInputText = input?.value?.trim() || '';
                this.finalTranscript = '';
                this.updateRecognitionLanguage();
                this.recognition.start();
                showToast(window.languageManager?.text('toast_listening', 'Listening... Speak now.') || 'Listening... Speak now.', 'info');
            } catch (_) {
                this.isListening = false;
                this.updateVoiceButton();
            }
        }

        stop() {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceButton();
        }

        updateVoiceButton() {
            const btn = document.getElementById('chatVoiceBtn');
            if (!btn) return;

            const voiceTextNode = document.getElementById('chatVoiceText');
            btn.classList.toggle('listening', this.isListening);
            const listeningLabel = window.languageManager?.currentLang === 'hi'
                ? 'सुन रहे हैं...'
                : 'Listening...';
            const idleLabel = window.languageManager?.text('chat_voice_aria', 'Voice input')
                || window.languageManager?.text('chat_voice', 'Voice')
                || 'Voice input';
            const activeLabel = `${idleLabel}: ${listeningLabel}`;
            btn.setAttribute('aria-label', this.isListening ? activeLabel : idleLabel);
            btn.setAttribute('title', this.isListening ? listeningLabel : idleLabel);

            if (voiceTextNode) {
                voiceTextNode.textContent = window.languageManager?.text('chat_voice', 'Voice') || 'Voice';
            }
        }

        updateRecognitionLanguage() {
            if (!this.recognition) return;
            const lang = window.languageManager?.currentLang || 'en';
            this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        }
    }

    class ReportExporter {
        async exportPDF(data) {
            const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : [];
            if (!recommendations.length) {
                showToast('No recommendation data available to export.', 'warning');
                return;
            }

            showToast('Generating PDF report...', 'info');

            if (window.jspdf && window.jspdf.jsPDF) {
                const doc = new window.jspdf.jsPDF();
                doc.setFontSize(16);
                doc.text('KrishiPro Crop Recommendation Report', 14, 20);
                doc.setFontSize(10);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

                let y = 40;
                recommendations.forEach((r, i) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(`${i + 1}. ${r.name}`, 14, y);
                    y += 6;
                    const reportProfit = r.expected_profit ?? r.profit ?? 0;
                    const reportRoi = r.roi ?? ((r.profit && r.cost) ? (r.profit / Math.max(r.cost, 1)) * 100 : 0);
                    const reportRisk = r.risk_level ?? r.risk ?? 'NA';
                    doc.text(`Profit: INR ${Math.round(reportProfit).toLocaleString('en-IN')} | ROI: ${Number(reportRoi).toFixed(1)}% | Risk: ${reportRisk}`, 18, y);
                    y += 8;
                });

                doc.save('crop-recommendation-report.pdf');
                showToast('PDF report downloaded.', 'success');
                return;
            }

            const fallback = this.generateCSV(data);
            const blob = new Blob([fallback], { type: 'text/csv' });
            this.downloadFile(blob, 'crop-recommendation-report.csv');
            showToast('PDF library unavailable. Downloaded CSV instead.', 'warning');
        }

        async exportExcel(data) {
            const csv = this.generateCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            this.downloadFile(blob, 'crop-data.csv');
            showToast('CSV report downloaded.', 'success');
        }

        generateCSV(data) {
            if (!Array.isArray(data?.recommendations) || data.recommendations.length === 0) {
                return 'No data available';
            }

            const headers = ['Rank', 'Crop', 'Profit', 'ROI', 'Risk', 'Yield_Qtl', 'Price_Per_Qtl'];
            const rows = data.recommendations.map((r, i) => [
                i + 1,
                r.name,
                Math.round(r.expected_profit ?? r.profit ?? 0),
                Number(r.roi ?? ((r.profit && r.cost) ? (r.profit / Math.max(r.cost, 1)) * 100 : 0)).toFixed(1),
                r.risk_level ?? r.risk ?? 'NA',
                Math.round(r.expected_yield_qtl ?? r.yieldQtl ?? 0),
                Math.round(r.market_price_per_qtl ?? r.price ?? 0),
            ]);

            return [headers, ...rows]
                .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');
        }

        downloadFile(blob, filename) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    class OfflineManager {
        constructor() {
            this.isOnline = navigator.onLine;
            this.initServiceWorker();
            this.setupEventListeners();
            this.updateOnlineStatus();
        }

        async initServiceWorker() {
            if (!('serviceWorker' in navigator)) return;
            try {
                await navigator.serviceWorker.register('/sw.js');
            } catch (_) {
                showToast('Service worker registration failed.', 'warning');
            }
        }

        setupEventListeners() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.updateOnlineStatus();
                showToast('Back online. Data sync resumed.', 'success');
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.updateOnlineStatus();
                showToast('You are offline. Cached mode enabled.', 'warning');
            });
        }

        updateOnlineStatus() {
            const indicator = document.getElementById('onlineIndicator');
            if (!indicator) return;
            indicator.className = this.isOnline ? 'online-indicator online' : 'online-indicator offline';
            indicator.textContent = this.isOnline ? 'Online' : 'Offline';
        }
    }

    class NotificationManager {
        constructor() {
            this.permission = 'Notification' in window ? Notification.permission : 'denied';
            this.priceSnapshot = {};
        }

        async requestPermission() {
            if (!('Notification' in window)) return false;
            if (this.permission === 'granted') return true;

            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        async sendNotification(title, options = {}) {
            const granted = await this.requestPermission();
            if (!granted) return;

            const notification = new Notification(title, {
                icon: '/static/images/icon-192.svg',
                badge: '/static/images/badge-72.svg',
                ...options,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        getActiveLocation() {
            const state = document.getElementById('stateSelect')?.value || 'Punjab';
            const district = document.getElementById('districtSelect')?.value || 'Ludhiana';
            return { state, district };
        }

        async checkPriceChanges() {
            const { state, district } = this.getActiveLocation();
            if (!state || !district || typeof window.apiUrl !== 'function') return;

            try {
                const response = await fetch(window.apiUrl(`/mandi-prices?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`), {
                    headers: { Accept: 'application/json' },
                });
                if (!response.ok) return;
                const payload = await response.json();
                const prices = Array.isArray(payload.prices) ? payload.prices : [];
                if (!prices.length) return;

                prices.slice(0, 10).forEach((entry) => {
                    const crop = String(entry.crop || '').trim();
                    const modal = Number(entry.modal_price || 0);
                    if (!crop || !modal) return;

                    const key = crop.toLowerCase();
                    const previous = this.priceSnapshot[key];
                    this.priceSnapshot[key] = modal;

                    if (!previous || previous <= 0) return;
                    const pct = ((modal - previous) / previous) * 100;
                    if (Math.abs(pct) < 5.5) return;

                    this.sendNotification('KrishiPro Price Alert', {
                        body: `${crop} moved ${pct > 0 ? 'up' : 'down'} by ${pct.toFixed(1)}% in ${district}. Latest: INR ${Math.round(modal).toLocaleString('en-IN')}/qtl`,
                        tag: `price-alert-${key}`,
                    });
                });
            } catch (_) {
                // Fail silently for background alerts.
            }
        }

        setupPriceAlerts() {
            this.checkPriceChanges();
            setInterval(() => this.checkPriceChanges(), 10 * 60 * 1000);
        }
    }

    class ChatbotAssistant {
        constructor() {
            this.isOpen = false;
            this.messages = [];
            this.responses = CHATBOT_RESPONSES;
            this.history = [];
            this.lastFailedMessage = '';
            this.lastSentMessage = '';
            this.chatStatusEl = document.getElementById('chatStatus');
            this.retryBtn = document.getElementById('chatRetryBtn');
            this.setStatus(this.t('status_ready', 'Status: Ready'), 'live');
            this.setRetryEnabled(false);
        }

        t(key, fallback) {
            return window.languageManager?.text(key, fallback) || fallback;
        }

        toggle() {
            this.isOpen = !this.isOpen;
            const widget = document.getElementById('chatWidget');
            if (!widget) return;

            widget.classList.toggle('open', this.isOpen);
            if (this.isOpen && this.messages.length === 0) {
                this.addMessage('bot', this.getGreeting());
            }
        }

        getGreeting() {
            const greetings = this.responses.greetings || ['How can I help you?'];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        setStatus(text, variant = 'live') {
            if (!this.chatStatusEl) return;
            this.chatStatusEl.textContent = text;
            this.chatStatusEl.classList.remove('live', 'fallback', 'error');
            this.chatStatusEl.classList.add(variant);
        }

        setRetryEnabled(enabled) {
            if (!this.retryBtn) return;
            this.retryBtn.disabled = !enabled;
        }

        refreshLanguage() {
            this.setStatus(this.t('status_ready', 'Status: Ready'), 'live');
            if (this.retryBtn) {
                this.retryBtn.textContent = this.t('chat_retry', 'Retry Last Message');
            }
        }

        async retryLastMessage() {
            if (!this.lastFailedMessage) {
                showToast(this.t('toast_retry_unavailable', 'No failed message to retry.'), 'info');
                return;
            }
            await this.sendMessage(this.lastFailedMessage, { isRetry: true });
        }

        async sendMessage(text, options = {}) {
            if (!text || !text.trim()) return;

            if (window.voiceInput?.isListening) {
                window.voiceInput.stop();
            }

            const messageText = text.trim();
            this.lastSentMessage = messageText;

            if (!options.isRetry) {
                this.addMessage('user', messageText);
            }
            this.setStatus(this.t('status_sending', 'Status: Sending...'), 'live');
            this.setRetryEnabled(false);

            const start = performance.now();

            const typingToken = `typing_${Date.now()}`;
            this.messages.push({ sender: 'bot', text: this.t('chat_thinking', 'Thinking...'), typingToken, timestamp: Date.now() });
            this.renderMessages();

            const replyPayload = await this.getResponse(messageText);
            this.messages = this.messages.filter((item) => item.typingToken !== typingToken);
            this.addMessage('bot', replyPayload.text);

            if (replyPayload.mode === 'live') {
                this.lastFailedMessage = '';
                this.setStatus(`${this.t('status_live', 'Status: Live')} (${replyPayload.provider})`, 'live');
                this.setRetryEnabled(false);
            } else {
                this.lastFailedMessage = messageText;
                const statusText = replyPayload.rateLimited
                    ? this.t('status_rate_limited', 'Status: Rate-limited, fallback response')
                    : this.t('status_fallback', 'Status: Fallback response');
                this.setStatus(statusText, replyPayload.rateLimited ? 'error' : 'fallback');
                this.setRetryEnabled(true);
            }

            if (typeof window.sendTelemetryEvent === 'function') {
                window.sendTelemetryEvent('chat_response', {
                    mode: replyPayload.mode,
                    provider: replyPayload.provider,
                    rate_limited: !!replyPayload.rateLimited,
                    latency_ms: Math.round(performance.now() - start),
                });
            }
        }

        async getResponse(userText) {
            if (typeof window.apiUrl === 'function') {
                try {
                    const languageCode = window.languageManager?.currentLang || 'en';
                    const language = languageCode === 'hi' ? 'hindi' : 'english';

                    const context = {
                        state: document.getElementById('stateSelect')?.value || '',
                        district: document.getElementById('districtSelect')?.value || '',
                        season: document.getElementById('seasonSelect')?.value || '',
                        soil: document.getElementById('soilSelect')?.value || '',
                        recommendations: (window.latestRecommendations || []).slice(0, 3).map((item) => ({
                            crop: item.name,
                            profit: item.profit,
                            risk_level: item.risk,
                            market_price: item.price,
                            price_source: item.source || 'frontend',
                        })),
                    };

                    const response = await fetch(window.apiUrl('/chat'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        body: JSON.stringify({
                            message: userText,
                            history: this.history.slice(-8),
                            context,
                            preference: {
                                mode: 'balanced',
                                language,
                            },
                        }),
                    });

                    const payload = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        const error = new Error(payload?.errors?.[0] || `Chat failed (${response.status})`);
                        error.status = response.status;
                        throw error;
                    }

                    const reply = String(payload.reply || '').trim();
                    if (reply) {
                        this.history.push({ role: 'user', content: userText });
                        this.history.push({ role: 'assistant', content: reply });
                        return {
                            text: reply,
                            mode: payload.provider === 'fallback' ? 'fallback' : 'live',
                            provider: payload.provider || 'unknown',
                            rateLimited: false,
                        };
                    }
                } catch (_) {
                    const rateLimited = _.status === 429;
                    const fallbackText = this.getLocalFallbackResponse(userText, rateLimited);
                    return {
                        text: fallbackText,
                        mode: 'fallback',
                        provider: 'local',
                        rateLimited,
                    };
                }
            }

            return {
                text: this.getLocalFallbackResponse(userText, false),
                mode: 'fallback',
                provider: 'local',
                rateLimited: false,
            };
        }

        getLocalFallbackResponse(userText, rateLimited) {
            if (rateLimited) {
                return 'AI assistant is receiving high traffic right now. Please retry in a few seconds. Meanwhile, you can continue with crop comparison and export tools.';
            }

            const lower = userText.toLowerCase();
            const questions = this.responses.cropQuestions || {};
            const hit = Object.keys(questions).find((key) => lower.includes(key));
            if (hit) return questions[hit];

            return 'I can assist with recommendation comparison, weather decisions, and report exports.';
        }

        addMessage(sender, text) {
            this.messages.push({ sender, text, timestamp: Date.now() });
            this.renderMessages();
        }

        escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        renderMessages() {
            const container = document.getElementById('chatMessages');
            if (!container) return;

            container.innerHTML = this.messages
                .map((msg) => {
                    const typingClass = msg.typingToken ? ' typing' : '';
                    return `<div class="chat-message ${msg.sender}${typingClass}"><div class="message-text">${this.escapeHtml(msg.text)}</div></div>`;
                })
                .join('');
            container.scrollTop = container.scrollHeight;
        }
    }

    function normalizeRecommendation(raw) {
        return {
            key: raw.key,
            name: raw.name,
            emoji: raw.emoji,
            expected_profit: Number(raw.profit || 0),
            roi: Number(raw.cost || 0) > 0 ? (Number(raw.profit || 0) / Number(raw.cost || 1)) * 100 : 0,
            risk_level: raw.risk || 'Medium',
            expected_yield_qtl: Number(raw.yieldQtl || 0),
            market_price_per_qtl: Number(raw.price || 0),
            confidence: Number(raw.confidence || 0),
        };
    }

    function initAdvancedFeatures() {
        window.cropComparison = new CropComparison();
        window.languageManager = new LanguageManager();
        window.voiceInput = new VoiceInput();
        window.reportExporter = new ReportExporter();
        window.offlineManager = new OfflineManager();
        window.notificationManager = new NotificationManager();
        window.chatbot = new ChatbotAssistant();
        window.notificationManager.setupPriceAlerts();

        window.addRecommendationToComparison = (cropKey) => {
            const list = Array.isArray(window.latestRecommendations) ? window.latestRecommendations : [];
            const found = list.find((item) => item.key === cropKey);
            if (!found) {
                showToast('No recommendation found for this crop.', 'warning');
                return;
            }
            window.cropComparison.addCrop(normalizeRecommendation(found));
        };

        window.addTopRecommendationsToComparison = () => {
            const list = Array.isArray(window.latestRecommendations) ? window.latestRecommendations.slice(0, 2) : [];
            if (list.length < 2) {
                showToast('Run analysis first to compare top crops.', 'warning');
                return;
            }
            list.forEach((item) => window.cropComparison.addCrop(normalizeRecommendation(item)));
        };

        window.exportLatestReport = () => {
            const list = Array.isArray(window.latestRecommendations) ? window.latestRecommendations : [];
            if (!list.length) {
                showToast('No recommendations available to export.', 'warning');
                return;
            }
            const payload = { recommendations: list.map((item) => normalizeRecommendation(item)) };
            window.reportExporter.exportPDF(payload);
        };

        window.languageManager.updateUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdvancedFeatures);
    } else {
        initAdvancedFeatures();
    }
})();
