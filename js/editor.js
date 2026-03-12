/**
 * BuildFlow Editor
 * محرر السحب والإفلات
 */

class BuildFlowEditor {
    constructor() {
        this.elements = [];
        this.selectedElement = null;
        this.draggedElement = null;
        this.canvas = document.getElementById('editorPage');
        this.emptyState = document.getElementById('emptyState');
    }

    init() {
        this.bindEvents();
        this.makeDraggable(document.getElementById('demo-element'));
    }

    bindEvents() {
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElement) {
                this.deleteElement(this.selectedElement.id);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }
        });
    }

    addElement(type) {
        // إخفاء الحالة الفارغة
        if (this.emptyState.parentNode) {
            this.emptyState.remove();
        }

        const id = `el-${Date.now()}`;
        const element = document.createElement('div');
        element.className = 'draggable-element';
        element.id = id;
        
        const content = this.getElementContent(type, id);
        element.innerHTML = content;
        
        this.canvas.appendChild(element);
        this.makeDraggable(element);
        this.selectElement(element);
        
        showToast(`✅ تم إضافة: ${type}`);
        return element;
    }

    getElementContent(type, id) {
        const contents = {
            text: `
                <div style="padding: 20px;">
                    <h2 contenteditable="true">عنوان قابل للتعديل</h2>
                    <p contenteditable="true" style="color: var(--gray);">انقر هنا لتعديل النص...</p>
                </div>
                <button class="delete-btn" onclick="editor.deleteElement('${id}')">✕</button>
            `,
            button: `
                <div style="padding: 20px; text-align: center;">
                    <button style="background: var(--primary); color: white; border: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; cursor: pointer;" contenteditable="true">
                        زر تفاعلي
                    </button>
                </div>
                <button class="delete-btn" onclick="editor.deleteElement('${id}')">✕</button>
            `,
            image: `
                <div style="padding: 20px;">
                    <div class="image-placeholder" style="width: 100%; height: 200px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="this.querySelector('input').click()">
                        <input type="file" accept="image/*" style="display: none;" onchange="editor.handleImage(this, '${id}')">
                        <span style="color: var(--gray);">📷 انقر لإضافة صورة</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="editor.deleteElement('${id}')">✕</button>
            `,
            section: `
                <div style="padding: 40px 20px; background: #f8fafc; border-radius: 16px; margin: 20px 0;">
                    <h3 contenteditable="true">قسم جديد</h3>
                    <p contenteditable="true">محتوى القسم يمكن تعديله هنا...</p>
                </div>
                <button class="delete-btn" onclick="editor.deleteElement('${id}')">✕</button>
            `
        };
        
        return contents[type] || contents.text;
    }

    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        element.addEventListener('mousedown', (e) => {
            // تجاهل إذا كان الضغط على عنصر تفاعلي
            if (e.target.isContentEditable || 
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'INPUT' ||
                e.target.closest('button')) {
                return;
            }

            isDragging = true;
            this.selectElement(element);
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            initialLeft = rect.left - canvasRect.left;
            initialTop = rect.top - canvasRect.top;
            
            element.style.position = 'absolute';
            element.style.left = initialLeft + 'px';
            element.style.top = initialTop + 'px';
            element.style.width = rect.width + 'px';
            element.style.zIndex = 1000;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            element.style.left = (initialLeft + dx) + 'px';
            element.style.top = (initialTop + dy) + 'px';
        };

        const onMouseUp = () => {
            isDragging = false;
            element.style.zIndex = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }

    selectElement(element) {
        // إلغاء التحديد السابق
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        
        this.selectedElement = element;
        element.classList.add('selected');
    }

    deleteElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
            showToast('🗑️ تم الحذف');
            
            // إظهار الحالة الفارغة إذا لم يبقَ شيء
            if (this.canvas.children.length === 0) {
                this.canvas.appendChild(this.emptyState);
            }
        }
    }

    handleImage(input, id) {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('❌ يرجى اختيار صورة فقط');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ الحد الأقصى 5 ميجابايت');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const placeholder = input.closest('.image-placeholder');
            placeholder.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
            showToast('✅ تم رفع الصورة');
        };
        reader.readAsDataURL(file);
    }

    save() {
        const data = {
            elements: Array.from(this.canvas.children).map(el => ({
                id: el.id,
                html: el.innerHTML,
                style: {
                    position: el.style.position,
                    left: el.style.left,
                    top: el.style.top
                }
            })),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('buildflow-project', JSON.stringify(data));
        showToast('💾 تم الحفظ');
        return data;
    }

    load() {
        const saved = localStorage.getItem('buildflow-project');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            // استعادة العناصر
            showToast('📂 تم استعادة المشروع');
        } catch (e) {
            console.error('فشل في تحميل المشروع');
        }
    }

    publish() {
        const data = this.save();
        // محاكاة النشر
        showLoading(true);
        
        setTimeout(() => {
            showLoading(false);
            const url = `https://buildflow.app/site/${Math.random().toString(36).substr(2, 9)}`;
            showToast(`🚀 تم النشر: ${url}`);
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url);
            }
        }, 2000);
    }
}

// إنشاء instance
const editor = new BuildFlowEditor();
