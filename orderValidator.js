// Файл orderValidator.js
class OrderValidator {
    constructor() {
        this.notificationContainer = null;
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        this.createNotificationContainer();
        this.setupFormValidation();
        this.disableBrowserValidation();
        this.isInitialized = true;
        
        console.log('OrderValidator initialized');
    }
    
    createNotificationContainer() {
        // Удаляем старый контейнер если есть
        const oldContainer = document.querySelector('.notifications-container');
        if (oldContainer) {
            oldContainer.remove();
        }
        
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.className = 'notifications-container';
        document.body.appendChild(this.notificationContainer);
    }
    
    disableBrowserValidation() {
        const orderForm = document.querySelector('.order-form');
        if (orderForm) {
            // Отключаем браузерную валидацию
            orderForm.setAttribute('novalidate', 'novalidate');
        }
    }
    
    setupFormValidation() {
        const orderForm = document.querySelector('.order-form');
        const submitBtn = document.querySelector('.submit-btn');
        
        if (orderForm && submitBtn) {
            // Удаляем старые обработчики
            const newSubmitBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            
            // Добавляем обработчик на кнопку отправки
            newSubmitBtn.addEventListener('click', (e) => {
                this.handleSubmitClick(e);
            });
            
            console.log('Form validation setup complete');
        } else {
            console.error('Form or submit button not found');
        }
    }
    
    handleSubmitClick = (e) => {
        e.preventDefault();
        console.log('Submit button clicked');
        
        // Сначала проверяем валидность заказа (состав ланча)
        const orderValidation = this.validateOrder();
        if (!orderValidation.isValid) {
            console.log('Order validation failed');
            this.showNotification(orderValidation.message, 'error');
            return;
        }
        
        // Затем проверяем личные данные
        const personalDataValidation = this.validatePersonalData();
        if (!personalDataValidation.isValid) {
            console.log('Personal data validation failed');
            this.showNotification(personalDataValidation.message, 'error');
            return;
        }
        
        console.log('All validations passed - submitting form');
        this.submitForm();
    }
    
    validateOrder() {
        console.log('Starting order validation');
        
        // Проверяем доступность orderManager
        if (typeof orderManager === 'undefined') {
            console.error('OrderManager is not defined');
            return {
                isValid: false,
                message: 'Ошибка системы. Пожалуйста, обновите страницу.'
            };
        }
        
        // Получаем текущие выбранные блюда
        const selectedDishes = orderManager.getSelectedDishes();
        console.log('Current selected dishes:', selectedDishes);
        
        const validationResult = this.checkLunchCombo(selectedDishes);
        
        if (!validationResult.isValid) {
            return {
                isValid: false,
                message: validationResult.message
            };
        }
        
        console.log('Order validation passed');
        return { isValid: true };
    }
    
    validatePersonalData() {
        console.log('Validating personal data');
        
        const requiredFields = [
            { id: 'name', name: 'Имя' },
            { id: 'email', name: 'Email' },
            { id: 'phone', name: 'Телефон' },
            { id: 'address', name: 'Адрес доставки' }
        ];
        
        const errors = [];
        
        // Проверяем обязательные поля
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input && !input.value.trim()) {
                errors.push(`• ${field.name} - обязательное поле`);
            }
        });
        
        // Проверяем выбор времени доставки
        const deliveryTimeSelected = document.querySelector('input[name="delivery_time"]:checked');
        if (!deliveryTimeSelected) {
            errors.push('• Выберите время доставки');
        }
        
        // Если выбрано конкретное время, проверяем его заполнение
        if (deliveryTimeSelected && deliveryTimeSelected.value === 'specific') {
            const timeInput = document.getElementById('delivery-time-input');
            if (timeInput && !timeInput.value) {
                errors.push('• Укажите конкретное время доставки');
            }
        }
        
        // Проверяем валидность email
        const emailInput = document.getElementById('email');
        if (emailInput && emailInput.value.trim() && !this.isValidEmail(emailInput.value)) {
            errors.push('• Введите корректный email адрес');
        }
        
        // Проверяем валидность телефона (базовая проверка)
        const phoneInput = document.getElementById('phone');
        if (phoneInput && phoneInput.value.trim()) {
            const phone = phoneInput.value.replace(/\D/g, '');
            if (phone.length < 10) {
                errors.push('• Введите корректный номер телефона (минимум 10 цифр)');
            }
        }
        
        if (errors.length > 0) {
            return {
                isValid: false,
                message: `Заполните следующие поля:<br><ul class="error-list">${errors.map(error => `<li>${error}</li>`).join('')}</ul>`
            };
        }
        
        console.log('Personal data validation passed');
        return { isValid: true };
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    checkLunchCombo(selectedDishes) {
        const hasSoup = selectedDishes.soup !== null;
        const hasMain = selectedDishes.main !== null;
        const hasSalad = selectedDishes.salad !== null;
        const hasDrink = selectedDishes.drink !== null;
        const hasDessert = selectedDishes.dessert !== null;
        
        console.log('Combo check - hasSoup:', hasSoup, 'hasMain:', hasMain, 'hasSalad:', hasSalad, 'hasDrink:', hasDrink, 'hasDessert:', hasDessert);
        
        // Проверяем, что выбрано хотя бы одно блюдо
        if (!hasSoup && !hasMain && !hasSalad && !hasDrink && !hasDessert) {
            console.log('Validation failed: Nothing selected');
            return {
                isValid: false,
                message: 'Ничего не выбрано. Выберите блюда для заказа'
            };
        }
        
        // Проверяем обязательный напиток
        if (!hasDrink) {
            console.log('Validation failed: No drink selected');
            return {
                isValid: false,
                message: 'Обязательно выберите напиток'
            };
        }
        
        // Проверяем варианты комбо из бизнес-ланчей
        const combo1 = hasSoup && hasMain && hasSalad && hasDrink;      // Полный обед
        const combo2 = hasSoup && hasMain && hasDrink;                  // Классический
        const combo3 = hasSoup && hasSalad && hasDrink;                 // Легкий
        const combo4 = hasMain && hasSalad && hasDrink;                 // Сытный
        const combo5 = hasMain && hasDrink;                             // Базовый
        
        const isValidCombo = combo1 || combo2 || combo3 || combo4 || combo5;
        
        console.log('Combo validation result:', isValidCombo);
        
        if (!isValidCombo) {
            if (!hasMain && !hasSalad) {
                console.log('Validation failed: No main dish or salad');
                return {
                    isValid: false,
                    message: 'Выберите главное блюдо или салат'
                };
            } else if (!hasSoup && !hasMain) {
                console.log('Validation failed: No soup or main dish');
                return {
                    isValid: false,
                    message: 'Выберите суп или главное блюдо'
                };
            } else if (!hasMain) {
                console.log('Validation failed: No main dish');
                return {
                    isValid: false,
                    message: 'Выберите главное блюдо'
                };
            }
        }
        
        console.log('Validation passed: Valid combo selected');
        return { isValid: true };
    }
    
    submitForm() {
        console.log('Preparing to submit form');
        const form = document.querySelector('.order-form');
        
        if (!form) {
            console.error('Form not found');
            this.showNotification('Ошибка формы. Пожалуйста, обновите страницу.', 'error');
            return;
        }
        
        // Собираем данные формы для отображения в уведомлении
        const orderSummary = this.getOrderSummary();
        
        // Показываем подтверждение заказа
        this.showOrderConfirmation(orderSummary, () => {
            // После подтверждения отправляем форму
            this.actuallySubmitForm(form);
        });
    }
    
    getOrderSummary() {
        const selectedDishes = orderManager.getSelectedDishes();
        const total = Object.values(selectedDishes)
            .filter(dish => dish !== null)
            .reduce((sum, dish) => sum + dish.price, 0);
        
        const categoryNames = {
            soup: 'Суп',
            salad: 'Салат',
            main: 'Главное блюдо',
            drink: 'Напиток',
            dessert: 'Десерт'
        };
        
        let summary = '<h4>Детали заказа:</h4>';
        
        Object.entries(selectedDishes).forEach(([category, dish]) => {
            if (dish) {
                summary += `<p><strong>${categoryNames[category]}:</strong> ${dish.name} - ${dish.price} руб.</p>`;
            }
        });
        
        summary += `<p><strong>Итого:</strong> ${total} руб.</p>`;
        
        // Добавляем данные клиента
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const phone = document.getElementById('phone').value;
        
        summary += `<hr><h4>Данные клиента:</h4>`;
        summary += `<p><strong>Имя:</strong> ${name}</p>`;
        summary += `<p><strong>Адрес:</strong> ${address}</p>`;
        summary += `<p><strong>Телефон:</strong> ${phone}</p>`;
        
        return summary;
    }
    
    showOrderConfirmation(orderSummary, onConfirm) {
        const notification = document.createElement('div');
        notification.className = 'notification confirmation';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>Подтверждение заказа</h3>
                <div class="order-summary-details">
                    ${orderSummary}
                </div>
                <p>Всё верно?</p>
                <div class="confirmation-buttons">
                    <button class="notification-cancel-btn">Изменить</button>
                    <button class="notification-confirm-btn">Подтвердить заказ</button>
                </div>
            </div>
            <div class="notification-overlay"></div>
        `;
        
        this.showCustomNotification(notification);
        
        // Обработчики кнопок
        const cancelBtn = notification.querySelector('.notification-cancel-btn');
        const confirmBtn = notification.querySelector('.notification-confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        confirmBtn.addEventListener('click', () => {
            this.hideNotification(notification);
            onConfirm();
        });
        
        // Закрытие по overlay
        const overlay = notification.querySelector('.notification-overlay');
        overlay.addEventListener('click', () => {
            this.hideNotification(notification);
        });
    }
    
    actuallySubmitForm(form) {
        console.log('Submitting form to httpbin');
        
        // Собираем данные формы
        const formData = new FormData(form);
        
        // Добавляем данные о выбранных блюдах
        const selectedDishes = orderManager.getSelectedDishes();
        Object.entries(selectedDishes).forEach(([category, dish]) => {
            if (dish) {
                formData.append(`selected_${category}`, dish.name);
                formData.append(`selected_${category}_price`, dish.price.toString());
            }
        });
        
        // Отправляем форму
        fetch(form.action, {
            method: form.method,
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Form submitted successfully:', data);
            this.showSuccessNotification();
        })
        .catch(error => {
            console.error('Form submission error:', error);
            this.showNotification('Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.', 'error');
        });
    }
    
    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>Успех!</h3>
                <p>Ваш заказ успешно отправлен!</p>
                <div class="success-details">
                    <p>Мы свяжемся с вами для подтверждения заказа.</p>
                    <p>Спасибо, что выбрали наш сервис!</p>
                </div>
                <button class="notification-ok-btn">Отлично</button>
            </div>
            <div class="notification-overlay"></div>
        `;
        
        this.showCustomNotification(notification);
    }
    
    showNotification(message, type = 'error') {
        console.log(`Showing ${type} notification:`, message);
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h3>${type === 'error' ? 'Внимание!' : 'Информация'}</h3>
                <div class="notification-message">${message}</div>
                <button class="notification-ok-btn">Окей</button>
            </div>
            <div class="notification-overlay"></div>
        `;
        
        this.showCustomNotification(notification);
    }
    
    showCustomNotification(notification) {
        // Удаляем существующие уведомления
        const existingNotifications = this.notificationContainer.querySelectorAll('.notification');
        existingNotifications.forEach(existingNotification => {
            this.hideNotification(existingNotification);
        });
        
        // Добавляем новое уведомление
        this.notificationContainer.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Обработчики закрытия
        this.setupNotificationCloseHandlers(notification);
    }
    
    setupNotificationCloseHandlers(notification) {
        // Кнопка "Окей"
        const okBtn = notification.querySelector('.notification-ok-btn');
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.hideNotification(notification);
            });
        }
        
        // Overlay
        const overlay = notification.querySelector('.notification-overlay');
        overlay.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        // Клавиша ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideNotification(notification);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        notification._escHandler = escHandler;
    }
    
    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                if (notification._escHandler) {
                    document.removeEventListener('keydown', notification._escHandler);
                }
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Инициализация
let orderValidator;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing OrderValidator');
    
    // Даем время другим скриптам загрузиться
    setTimeout(() => {
        orderValidator = new OrderValidator();
        window.orderValidator = orderValidator; // Делаем глобальной для тестирования
        
        console.log('OrderValidator initialized successfully');
        console.log('System ready - form validation is active');
    }, 500);
});