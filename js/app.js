// Класс для конфетти
class Confetti {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.colors = ['#FFE81A', '#FF6B6B', '#4ECDC4', '#45B7D1', '#9B59B6'];
        this.isActive = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        const z = Math.random() * 3;
        const scale = 0.3 + (z / 3) * 0.7;
        const baseSpeed = Math.random() * 3 + 2;
        
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            z: z,
            rotation: Math.random() * 360,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            size: (Math.random() * 10 + 5) * scale,
            speedY: baseSpeed * scale,
            speedX: (Math.random() * 2 - 1) * scale,
            speedRotation: (Math.random() * 2 - 1) * scale,
            opacity: 0.3 + (z / 3) * 0.7,
            life: 1,
            fadeSpeed: Math.random() * 0.005 + 0.002,
            fadeDelay: Math.random() * 3000 + 2000,
            scale: scale
        };
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation * Math.PI / 180);
        
        const color = particle.color.startsWith('#') 
            ? this.hexToRgba(particle.color, particle.opacity)
            : particle.color;
        
        this.ctx.fillStyle = color;
        
        if (particle.z > 2) {
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
        
        const size = particle.size;
        this.ctx.beginPath();
        this.ctx.moveTo(-size/2, -size/2);
        this.ctx.lineTo(0, -size/4);
        this.ctx.lineTo(size/2, -size/2);
        this.ctx.lineTo(size/4, 0);
        this.ctx.lineTo(size/2, size/2);
        this.ctx.lineTo(0, size/4);
        this.ctx.lineTo(-size/2, size/2);
        this.ctx.lineTo(-size/4, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    hexToRgba(hex, opacity) {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
    
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    update() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.sort((a, b) => a.z - b.z);

        if (this.particles.length < 100 && !this.startedFading) {
            for (let i = 0; i < 2; i++) {
                this.particles.push(this.createParticle());
            }
        }

        const currentTime = Date.now();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.y += particle.speedY;
            particle.x += particle.speedX;
            particle.rotation += particle.speedRotation;
            
            if (currentTime - this.startTime > particle.fadeDelay) {
                particle.life -= particle.fadeSpeed;
                particle.opacity = Math.max(0, particle.life) * (0.3 + (particle.z / 3) * 0.7);
            }
            
            particle.speedY *= 0.99;
            particle.speedRotation *= 0.98;

            if (particle.life <= 0 || particle.y > this.canvas.height + 20) {
                this.particles.splice(i, 1);
                continue;
            }

            this.drawParticle(particle);
        }

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.update());
        } else {
            this.isActive = false;
        }
    }

    start() {
        if (!this.isActive) {
            this.isActive = true;
            this.particles = [];
            this.startTime = Date.now();
            this.startedFading = false;
            
            for (let i = 0; i < 50; i++) {
                this.particles.push(this.createParticle());
            }
            
            setTimeout(() => {
                this.startedFading = true;
            }, 5000);
            
            this.update();
        }
    }

    stop() {
        this.startedFading = true;
    }
}

// Класс для работы с лотами
class LotService {
    constructor() {
        this.lots = [];
        this.loadSavedLots();
    }

    addLot(name) {
        if (!name.trim()) {
            throw new Error('Название лота не может быть пустым');
        }
        this.lots.push(name.trim());
        this.saveLots();
    }

    removeLot(index) {
        this.lots.splice(index, 1);
        this.saveLots();
    }

    getLots() {
        return [...this.lots];
    }

    exportLots() {
        if (this.lots.length === 0) {
            throw new Error('Нет лотов для экспорта');
        }
        const data = JSON.stringify(this.lots, null, 2);
        
        // Создаем имя файла с текущей датой
        const now = new Date();
        const fileName = `lots/lots_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;
        
        // Создаем ссылку для скачивания
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return data;
    }

    importLots(jsonData) {
        try {
            const importedLots = JSON.parse(jsonData);
            if (!Array.isArray(importedLots)) {
                throw new Error('Неверный формат данных');
            }
            this.lots = importedLots;
            this.saveLots();
        } catch (error) {
            throw new Error('Ошибка при импорте: ' + error.message);
        }
    }

    saveLots() {
        localStorage.setItem('wheelLots', JSON.stringify(this.lots));
    }

    loadSavedLots() {
        const savedLots = localStorage.getItem('wheelLots');
        if (savedLots) {
            try {
                this.lots = JSON.parse(savedLots);
            } catch (error) {
                console.error('Ошибка при загрузке сохраненных лотов:', error);
                this.loadDefaultLots();
            }
        } else {
            this.loadDefaultLots();
        }
    }

    loadDefaultLots() {
        fetch('lots/default_lots.json')
            .then(response => response.json())
            .then(data => {
                this.lots = data;
                this.saveLots();
                // Вызываем обновление UI после загрузки лотов
                if (window.app) {
                    window.app.wheel.drawWheel();
                    window.app.updateLotsList();
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке лотов по умолчанию:', error);
                this.lots = [];
            });
    }
}

// Класс для колеса
class Wheel {
    constructor(canvas, lotService) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lotService = lotService;
        this.isSpinning = false;
        this.currentRotation = 0;
        this.sectorBoundaries = [];
        
        this.canvas.width = 500;
        this.canvas.height = 500;
        
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
        ];
    }

    drawWheel() {
        const ctx = this.ctx;
        const center = this.canvas.width / 2;
        const radius = this.canvas.width / 2 - 10;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const lots = this.lotService.getLots();
        if (lots.length === 0) {
            this.drawEmptyWheel();
            return;
        }
        
        this.sectorBoundaries = [];
        const sliceAngle = (Math.PI * 2) / lots.length;
        const startOffset = -Math.PI / 2;
        
        lots.forEach((lot, index) => {
            const startAngle = index * sliceAngle + startOffset;
            const endAngle = startAngle + sliceAngle;
            
            this.sectorBoundaries.push({
                index,
                lot,
                startAngle,
                endAngle
            });
            
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            
            this.drawText(lot, center, center, startAngle + sliceAngle / 2, radius);
        });
    }

    drawEmptyWheel() {
        const ctx = this.ctx;
        const center = this.canvas.width / 2;
        const radius = this.canvas.width / 2 - 10;
        
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Добавьте лоты', center, center);
    }

    drawText(text, centerX, centerY, angle, radius) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        
        const maxWidth = radius - 40;
        let displayText = text;
        if (ctx.measureText(text).width > maxWidth) {
            displayText = text.substring(0, 15) + '...';
        }
        
        ctx.fillText(displayText, radius - 20, 6);
        ctx.restore();
    }

    spin(duration, spinType, onComplete) {
        if (this.isSpinning || this.lotService.getLots().length === 0) return;
        
        this.isSpinning = true;
        
        const lots = this.lotService.getLots();
        const randomSectorIndex = Math.floor(Math.random() * lots.length);
        const sectorAngle = (Math.PI * 2) / lots.length;
        const sectorOffset = Math.random() * sectorAngle;
        const baseAngle = randomSectorIndex * sectorAngle;
        const minRotations = 5;
        const maxRotations = 8;
        const rotations = minRotations + Math.random() * (maxRotations - minRotations);
        const fullRotations = rotations * Math.PI * 2;
        const targetAngle = baseAngle + sectorOffset + Math.PI / 2;
        const currentAngle = this.currentRotation % (Math.PI * 2);
        let deltaAngle = targetAngle - currentAngle;
        
        if (deltaAngle > 0) {
            deltaAngle = deltaAngle - Math.PI * 2;
        }
        
        const finalDelta = deltaAngle - fullRotations;

        let timingFunction;
        let actualDuration = duration;

        switch (spinType) {
            case 'bouncy':
                timingFunction = 'cubic-bezier(0.37, 0, 0.63, 1.4)';
                break;
            case 'slow':
                timingFunction = 'cubic-bezier(0.25, 0.1, 0.1, 0.98)';
                actualDuration = duration * 1.2;
                break;
            case 'smooth':
            default:
                timingFunction = 'cubic-bezier(0.4, 0, 0.2, 1)';
                break;
        }
        
        this.canvas.style.transitionProperty = 'transform';
        this.canvas.style.transitionDuration = `${actualDuration}s`;
        this.canvas.style.transitionTimingFunction = timingFunction;
        
        requestAnimationFrame(() => {
            this.currentRotation += finalDelta;
            this.canvas.style.transform = `rotate(${this.currentRotation}rad)`;
        });

        setTimeout(() => {
            this.isSpinning = false;
            if (onComplete) {
                onComplete(lots[randomSectorIndex]);
            }
        }, actualDuration * 1000);
    }

    getCurrentSector() {
        if (this.lotService.getLots().length === 0) return null;

        const transform = window.getComputedStyle(this.canvas).getPropertyValue('transform');
        let wheelAngle = 0;

        if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            wheelAngle = Math.atan2(matrix.b, matrix.a);
        }

        while (wheelAngle < 0) wheelAngle += Math.PI * 2;
        wheelAngle = wheelAngle % (Math.PI * 2);

        const arrowAngle = -Math.PI / 2;
        let absoluteAngle = arrowAngle - wheelAngle;
        while (absoluteAngle < 0) absoluteAngle += Math.PI * 2;
        absoluteAngle = absoluteAngle % (Math.PI * 2);

        return this.sectorBoundaries.find(sector => {
            let start = sector.startAngle;
            let end = sector.endAngle;
            
            while (start < 0) start += Math.PI * 2;
            while (end < 0) end += Math.PI * 2;
            
            start = start % (Math.PI * 2);
            end = end % (Math.PI * 2);
            
            if (start <= end) {
                return absoluteAngle >= start && absoluteAngle < end;
            } else {
                return absoluteAngle >= start || absoluteAngle < end;
            }
        });
    }
}

// Основной класс приложения
class App {
    constructor() {
        this.lotService = new LotService();
        this.wheel = new Wheel(document.getElementById('wheel'), this.lotService);
        this.confetti = new Confetti();
        
        this.currentLotElement = document.getElementById('currentLot');
        this.currentLotUpdateInterval = null;
        
        this.initEventListeners();
        this.wheel.drawWheel();
        this.updateLotsList();
        this.startCurrentLotUpdate();

        window.removeLot = this.removeLot.bind(this);
    }

    initEventListeners() {
        document.getElementById('addLot').addEventListener('click', () => this.handleAddLot());
        document.getElementById('lotName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddLot();
        });
        
        document.getElementById('exportLots').addEventListener('click', () => this.handleExport());
        document.getElementById('importLots').addEventListener('click', () => this.handleImportClick());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));
        
        document.getElementById('spinButton').addEventListener('click', () => this.handleSpin());
        
        document.getElementById('spinDuration').addEventListener('input', (e) => {
            document.getElementById('durationValue').textContent = e.target.value + 'с';
        });
    }

    handleAddLot() {
        const nameInput = document.getElementById('lotName');
        const name = nameInput.value.trim();
        
        try {
            this.lotService.addLot(name);
            this.wheel.drawWheel();
            nameInput.value = '';
            nameInput.focus();
            this.updateLotsList();
        } catch (error) {
            alert(error.message);
        }
    }

    handleExport() {
        try {
            const data = this.lotService.exportLots();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lots.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(error.message);
        }
    }

    handleImportClick() {
        document.getElementById('importFile').click();
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.lotService.importLots(e.target.result);
                this.wheel.drawWheel();
                this.updateLotsList();
                alert('Лоты успешно импортированы');
            } catch (error) {
                alert(error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    handleSpin() {
        if (this.wheel.isSpinning) return;
        
        const duration = parseInt(document.getElementById('spinDuration').value);
        const spinType = document.getElementById('spinType').value;
        const soundEnabled = document.getElementById('soundEnabled').checked;
        const confettiEnabled = document.getElementById('confettiEnabled').checked;
        
        document.getElementById('spinButton').disabled = true;
        
        // Убираем эффекты свечения при начале вращения
        this.currentLotElement.classList.remove('winner-glow');
        document.getElementById('wheel').classList.remove('winner-glow');
        
        if (soundEnabled) {
            // Здесь можно добавить звук
        }
        
        this.wheel.spin(duration, spinType, (winner) => {
            document.getElementById('spinButton').disabled = false;
            
            if (confettiEnabled) {
                this.confetti.start();
                setTimeout(() => this.confetti.stop(), 5000);
            }
            
            // Добавляем эффекты свечения при выигрыше
            this.currentLotElement.classList.add('winner-glow');
            document.getElementById('wheel').classList.add('winner-glow');
        });
    }

    updateLotsList() {
        const lotsList = document.getElementById('lotsList');
        lotsList.innerHTML = '';
        
        this.lotService.getLots().forEach((lot, index) => {
            const lotElement = document.createElement('div');
            lotElement.className = 'lot-item';
            lotElement.innerHTML = `
                <span>${lot}</span>
                <button onclick="removeLot(${index})">Удалить</button>
            `;
            lotsList.appendChild(lotElement);
        });
    }

    removeLot(index) {
        this.lotService.removeLot(index);
        this.wheel.drawWheel();
        this.updateLotsList();
    }

    startCurrentLotUpdate() {
        this.currentLotUpdateInterval = setInterval(() => {
            const currentSector = this.wheel.getCurrentSector();
            if (currentSector) {
                this.currentLotElement.textContent = currentSector.lot;
            } else {
                this.currentLotElement.textContent = 'Добавьте лоты';
            }
        }, 50);
    }
}

// Создаем глобальный экземпляр приложения
window.app = new App(); 