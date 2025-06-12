document.addEventListener('DOMContentLoaded', function() {

    const bookElement = document.getElementById('book');
    const container = document.querySelector('.container');

    // --- 1. 初始化翻页效果 (自适应尺寸) ---

    // 定义书本理想的宽高比 (高/宽)
    const bookAspectRatio = 4 / 3; 
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let bookWidth, bookHeight;

    // 根据屏幕宽高比，决定书本的尺寸以适应屏幕
    if (screenHeight / screenWidth > bookAspectRatio) {
        bookWidth = screenWidth * 0.9; // 留出 10% 的边距
        bookHeight = bookWidth * bookAspectRatio;
    } else {
        bookHeight = screenHeight * 0.9; // 留出 10% 的边距
        bookWidth = bookHeight / bookAspectRatio;
    }
    
    // 初始化 PageFlip 实例
    const pageFlip = new St.PageFlip(bookElement, {
        width: bookWidth,
        height: bookHeight,
        size: 'stretch',
        // 设定尺寸限制
        minWidth: 300,
        minHeight: 400,
        maxWidth: 1200,
        maxHeight: 1600,
        // 视觉效果
        drawShadow: true,
        flippingTime: 1000,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        maxShadowOpacity: 0.1,
        showCover: true,
        mobileScrollSupport: true
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // --- 2. 实现双指捏合缩放 和 单指拖动平移 ---
    
    // 缩放变量
    let isPinching = false;
    let startPinchDistance = 0;
    let currentScale = 1;
    let startScale = 1;
    
    // 平移变量
    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;
    let currentTranslateX = 0;
    let currentTranslateY = 0;
    let startTranslateX = 0;
    let startTranslateY = 0;

    // 辅助函数：计算两指之间的距离
    function getDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 重置变换（缩放和平移）
    function resetTransform(animated = false) {
        if (animated) {
            container.style.transition = 'transform 0.3s ease-in-out';
        } else {
            container.style.transition = 'none';
        }
        currentScale = 1;
        currentTranslateX = 0;
        currentTranslateY = 0;
        container.style.transform = `translate(0px, 0px) scale(1)`;
    }

    container.addEventListener('touchstart', function(e) {
        // 移除过渡效果，确保触摸响应的即时性
        container.style.transition = 'none';

        if (e.touches.length === 2) { // 双指 -> 开始缩放
            isPinching = true;
            isPanning = false;
            startPinchDistance = getDistance(e.touches);
            startScale = currentScale;
        } else if (e.touches.length === 1 && currentScale > 1) { // 单指且已缩放 -> 开始平移
            isPinching = false;
            isPanning = true;
            startPanX = e.touches[0].clientX;
            startPanY = e.touches[0].clientY;
            startTranslateX = currentTranslateX;
            startTranslateY = currentTranslateY;
        }
    }, { passive: false });

    container.addEventListener('touchmove', function(e) {
        if (isPinching || isPanning) {
            e.preventDefault(); // 阻止页面滚动等默认行为
        }
        
        if (isPinching && e.touches.length === 2) {
            // -- 处理缩放 --
            const currentPinchDistance = getDistance(e.touches);
            const scale = (currentPinchDistance / startPinchDistance) * startScale;
            currentScale = Math.max(1, Math.min(scale, 4)); // 限制缩放比例在 1x 到 4x 之间
            
        } else if (isPanning && e.touches.length === 1) {
            // -- 处理平移 --
            const dx = e.touches[0].clientX - startPanX;
            const dy = e.touches[0].clientY - startPanY;
            currentTranslateX = startTranslateX + dx;
            currentTranslateY = startTranslateY + dy;
            
            // -- 平移边界限制 --
            const scaledBookWidth = bookWidth * currentScale;
            const scaledBookHeight = bookHeight * currentScale;
            const maxTranslateX = (scaledBookWidth - bookWidth) / 2;
            const maxTranslateY = (scaledBookHeight - bookHeight) / 2;
            
            currentTranslateX = Math.max(-maxTranslateX, Math.min(currentTranslateX, maxTranslateX));
            currentTranslateY = Math.max(-maxTranslateY, Math.min(currentTranslateY, maxTranslateY));
        }

        // 应用变换
        if(isPinching || isPanning) {
            container.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
        }
    }, { passive: false });

    container.addEventListener('touchend', function(e) {
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
            startScale = currentScale; // 保存当前缩放值
        }
        if (isPanning && e.touches.length < 1) {
            isPanning = false;
        }
        
        // 如果缩放比例小于 1.1x，自动吸附回原始大小
        if (!isPinching && !isPanning && currentScale < 1.1) {
            resetTransform(true);
        }
    });
    
    // --- 3. 监听翻页事件 ---
    pageFlip.on('flip', (e) => {
        console.log('Flipped to page: ' + e.data);
        // 翻页时，重置所有缩放和平移
        if (currentScale !== 1 || currentTranslateX !== 0 || currentTranslateY !== 0) {
            resetTransform(true);
        }
    });

});