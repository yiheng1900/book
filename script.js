document.addEventListener('DOMContentLoaded', function() {

    const bookElement = document.getElementById('book');
    const container = document.querySelector('.container');

    // --- 1. 初始化翻页效果 ---

    const bookAspectRatio = 3 / 4; 
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let bookWidth, bookHeight;

    if (screenHeight / screenWidth > bookAspectRatio) {
        bookWidth = screenWidth * 0.85;
        bookHeight = bookWidth / bookAspectRatio;
    } else {
        bookHeight = screenHeight * 0.85;
        bookWidth = bookHeight * bookAspectRatio;
    }
    
    const pageFlip = new St.PageFlip(bookElement, {
        width: bookWidth,
        height: bookHeight,
        size: 'stretch',
        minWidth: 300,
        minHeight: 400,
        maxWidth: 1200,
        maxHeight: 1600,
        drawShadow: true,
        flippingTime: 1000,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        maxShadowOpacity: 0.2,
        showCover: true,
        mobileScrollSupport: true
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // --- 2. 实现双指捏合放大/缩小功能 ---
    
    let isPinching = false;
    let startPinchDistance = 0;
    let currentScale = 1;
    let startScale = 1;
    
    // 辅助函数：计算两指之间的距离
    function getDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    container.addEventListener('touchstart', function(e) {
        // 检查是否是双指触摸
        if (e.touches.length === 2) {
            isPinching = true;
            startPinchDistance = getDistance(e.touches);
            startScale = currentScale; // 保存当前的缩放比例
            pageFlip.flip('none'); // 缩放时禁止翻页
        }
    });

    container.addEventListener('touchmove', function(e) {
        if (isPinching && e.touches.length === 2) {
            e.preventDefault(); // 阻止页面默认的滚动或缩放行为
            
            const currentPinchDistance = getDistance(e.touches);
            const scale = (currentPinchDistance / startPinchDistance) * startScale;
            
            // 限制最小和最大缩放比例
            currentScale = Math.max(1, Math.min(scale, 4));
            
            // 应用缩放
            container.style.transform = `scale(${currentScale})`;
        }
    });

    container.addEventListener('touchend', function(e) {
        if (isPinching) {
            // 当手指抬起少于2个时，结束缩放
            if (e.touches.length < 2) {
                isPinching = false;
                // 如果缩放比例很接近1，则自动吸附回去
                if (currentScale < 1.1) {
                    currentScale = 1;
                    container.style.transition = 'transform 0.3s ease-in-out';
                    container.style.transform = 'scale(1)';
                } else {
                     // 否则，为下一次平滑缩放做准备
                    container.style.transition = 'none';
                }
            }
        }
    });
    
    // --- 3. (可选) 监听翻页事件 ---
    pageFlip.on('flip', (e) => {
        console.log('Flipped to page: ' + e.data);
        // 如果是从缩放状态恢复，确保transform被重置
        if(currentScale !== 1) {
            currentScale = 1;
            container.style.transition = 'transform 0.3s ease-in-out';
            container.style.transform = 'scale(1)';
            setTimeout(() => {
                 container.style.transition = 'none';
            }, 300);
        }
    });

});