// tour 新手指引定位纯函数（无 DOM 依赖，便于单元测试）
// computeTooltipPosition: 根据目标元素矩形、tooltip 尺寸、视口、首选方向，
// 计算 tooltip 的 {top, left, arrow} 像素坐标与箭头 CSS class。
//
// 语义（修复旧 bug：原 'left' 把 tooltip 放到右侧，命名反转）：
//   preferred 'bottom' → tooltip 在目标下方，箭头在 tooltip 顶部 (arrow='top')
//   preferred 'top'    → tooltip 在目标上方，箭头在 tooltip 底部 (arrow='bottom')
//   preferred 'left'   → tooltip 在目标左侧，箭头在 tooltip 右侧 (arrow='right')
//   preferred 'right'  → tooltip 在目标右侧，箭头在 tooltip 左侧 (arrow='left')
//
// 边界碰撞：若超出视口，按方向翻转；仍溢出则夹紧到视口内 [MARGIN, viewport - MARGIN]，
// 当 tooltip 宽度超出可用视口时隐藏箭头 (arrow='none')。

const GAP = 12;     // tooltip 与目标的间距
const MARGIN = 8;   // 视口安全边距

function computeTooltipPosition(targetRect, tooltipSize, viewport, preferred) {
    const tw = tooltipSize.width;
    const th = tooltipSize.height;
    const vw = viewport.w;
    const vh = viewport.h;

    // 可用范围
    const minLeft = MARGIN;
    const maxLeft = Math.max(MARGIN, vw - tw - MARGIN);
    const minTop = MARGIN;
    const maxTop = Math.max(MARGIN, vh - th - MARGIN);

    // tooltip 是否比可用视口还宽/高（无法完整容纳）
    const tooWide = tw > vw - 2 * MARGIN;
    const tooTall = th > vh - 2 * MARGIN;

    let top, left, arrow, side = preferred;

    // 1. 按首选方向计算初始坐标
    function initialCoords(dir) {
        switch (dir) {
            case 'bottom':
                return { top: targetRect.bottom + GAP, left: targetRect.left + targetRect.width / 2 - tw / 2, arrow: 'top' };
            case 'top':
                return { top: targetRect.top - th - GAP, left: targetRect.left + targetRect.width / 2 - tw / 2, arrow: 'bottom' };
            case 'left':
                return { top: targetRect.top + targetRect.height / 2 - th / 2, left: targetRect.left - tw - GAP, arrow: 'right' };
            case 'right':
                return { top: targetRect.top + targetRect.height / 2 - th / 2, left: targetRect.right + GAP, arrow: 'left' };
            default:
                return { top: targetRect.bottom + GAP, left: targetRect.left + targetRect.width / 2 - tw / 2, arrow: 'top' };
        }
    }

    // 2. 垂直方向碰撞翻转（bottom↔top）
    function flipVertical(dir) {
        if (dir === 'bottom' && targetRect.bottom + GAP + th > vh) {
            // 下方放不下，尝试上方
            if (targetRect.top - GAP - th >= 0) return 'top';
        }
        if (dir === 'top' && targetRect.top - GAP - th < 0) {
            if (targetRect.bottom + GAP + th <= vh) return 'bottom';
        }
        return dir;
    }

    // 3. 水平方向碰撞翻转（left↔right）
    function flipHorizontal(dir) {
        if (dir === 'left' && targetRect.left - GAP - tw < 0) {
            if (targetRect.right + GAP + tw <= vw) return 'right';
        }
        if (dir === 'right' && targetRect.right + GAP + tw > vw) {
            if (targetRect.left - GAP - tw >= 0) return 'left';
        }
        return dir;
    }

    // 先处理垂直/水平首选的翻转
    if (preferred === 'bottom' || preferred === 'top') {
        side = flipVertical(preferred);
    } else if (preferred === 'left' || preferred === 'right') {
        side = flipHorizontal(preferred);
    }

    const c = initialCoords(side);
    top = c.top;
    left = c.left;
    arrow = c.arrow;

    // 4. 夹紧到视口内
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;
    if (top < minTop) top = minTop;
    if (top > maxTop) top = maxTop;

    // 5. 极端情况：tooltip 过宽/过高无法完整容纳 → 隐藏箭头
    if (tooWide || tooTall) {
        arrow = 'none';
    }

    return { top: Math.round(top), left: Math.round(left), arrow };
}

// 兼容挂载到全局（浏览器）与模块导出（测试 vm）
if (typeof window !== 'undefined') {
    window.computeTooltipPosition = computeTooltipPosition;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { computeTooltipPosition };
}