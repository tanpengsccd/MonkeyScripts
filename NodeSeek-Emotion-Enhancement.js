// ==UserScript==
// @name         NodeSeek 表情包增强
// @namespace    https://www.nodeseek.com/
// @version      0.0.1
// @description  为 NodeSeek 添加更多表情包
// @author       TomyJan
// @match        *://www.nodeseek.com/*
// @icon         https://www.nodeseek.com/static/image/favicon/android-chrome-192x192.png
// @grant        none
// @license      MPL-2.0 License
// @supportURL   https://www.nodeseek.com/post-?-1
// @homepageURL  https://www.nodeseek.com/post-?-1
// @downloadURL  https://update.greasyfork.org/scripts/?/?.user.js
// @updateURL    https://update.greasyfork.org/scripts/?/?.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // 自定义表情包数据
    const customEmotionList = {
        "2233娘": { "name": "2233娘", "type": "png", "icon": "icon", "items": ["2233娘-大笑", "2233娘-吃惊", "2233娘-大哭", "2233娘-耶", "2233娘-卖萌", "2233娘-疑问", "2233娘-汗", "2233娘-困惑", "2233娘-怒", "2233娘-委屈", "2233娘-郁闷", "2233娘-第一", "2233娘-喝水", "2233娘-吐魂", "2233娘-无言"] },
        "小电视": { "name": "小电视", "type": "png", "icon": "icon", "items": ["小电视-笑", "小电视-发愁", "小电视-赞", "小电视-差评", "小电视-嘟嘴", "小电视-汗", "小电视-害羞", "小电视-吃惊", "小电视-哭泣", "小电视-太太喜欢", "小电视-好怒啊", "小电视-困惑", "小电视-我好兴奋", "小电视-思索", "小电视-无语"] }
    };

    // 页面加载完毕后初始化自定义表情包
    window.addEventListener('load', initCustomEmotions, false);

    function initCustomEmotions() {
        setupEmotionTitles();
        setupEmotionTitlesClickHandler();
        monitorExpContainerChanges();
    }

    // 设置自定义表情包标题
    function setupEmotionTitles() {
        const emotionTitleDiv = document.querySelector('.expression');
        Object.keys(customEmotionList).forEach(key => {
            const newDiv = createEmotionTitle(key);
            emotionTitleDiv.appendChild(newDiv);
        });
    }

    // 创建表情包标题元素
    function createEmotionTitle(key) {
        const newDiv = document.createElement('div');
        newDiv.id = `custom-emotion-${key}`;
        newDiv.classList.add('custom-emotion');
        newDiv.innerHTML = `&nbsp;${customEmotionList[key].name}&nbsp;`;
        addHoverEffect(newDiv);
        return newDiv;
    }

    // 添加标题鼠标悬浮效果
    function addHoverEffect(element) {
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.1)';
            element.style.transition = 'transform 0.3s ease';
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)';
        });
    }

    // 设置自定义表情包标题的点击事件处理
    function setupEmotionTitlesClickHandler() {
        document.querySelectorAll('.expression .custom-emotion').forEach(item => {
            item.addEventListener('click', () => {
                handleCustomEmotionClick(item);
            });
        });
    }

    // 处理点击自定义表情包标题事件
    function handleCustomEmotionClick(clickedItem) {
        const containerDiv = document.querySelector('.exp-container');

        // // 判断 containerDiv 的内容里面是不是包含 <!----> , 如果不包含就说明官方表情包打开了
        const isOfficial = containerDiv.innerHTML.indexOf('<!---->') === -1;


        const isCurrent = clickedItem.classList.contains('current-group');
        const isOpen = containerDiv.classList.contains('open');




        // 如果容器未打开或当前选中的不是点击的标题或者打开了官方表情包，则更新显示
        if (!isOpen || !isCurrent || isOfficial) {
            if (isOfficial) { // 打开了官方表情包
                document.querySelector('.exp-item.current-group').click();
                setTimeout(() => {
                    if (containerDiv.classList.contains('open')) { // 判断官方表情包是否已经关闭
                        return; // 关不掉就别干了吧
                        // TODO: 一个更好的方法避免这俩共存
                    } else
                        updateEmotionDisplay(clickedItem, containerDiv);
                }, 500);
            } else
                updateEmotionDisplay(clickedItem, containerDiv);
        } else { // 否则，清除并关闭
            // console.log('clear and close');
            containerDiv.classList.remove('open');
            clearEmotions();
        }
    }

    // 更新表情包显示
    function updateEmotionDisplay(clickedItem, containerDiv) {
        clearEmotions(); // 清除当前显示的表情包
        document.querySelectorAll('.expression .custom-emotion').forEach(item => {
            item.classList.remove('current-group');
        });

        clickedItem.classList.add('current-group');
        addEmotionsToContainer(clickedItem.id.replace('custom-emotion-', ''), containerDiv);
        containerDiv.classList.add('open');
    }

    // 清除表情包显示容器中的内容
    function clearEmotions() {
        const tempContainer = document.getElementById('temporary-container');
        tempContainer?.remove(); // 如果临时容器存在，则移除
    }

    // 向显示容器中添加表情包
    function addEmotionsToContainer(packKey, containerDiv) {
        const pack = customEmotionList[packKey];
        const container = document.createElement('div');
        container.id = 'temporary-container';

        pack.items.forEach(item => {
            const img = document.createElement('img');
            img.src = `https://emoji.shojo.cn/bili/src/${packKey}/${item}.${pack.type}`;
            img.alt = item;
            img.className = "sticker";
            img.style.maxWidth = "90px";
            container.appendChild(img);
        });

        // 给表情包图片添加点击事件
        container.addEventListener('click', (e) => {
            insertToEditor(e.target.src);
            // const target = e.target;
            // if (target.tagName === 'IMG') {
            //     const textarea = document.querySelector('.editor textarea');
            //     textarea.value += `![${target.alt}](https://emoji.shojo.cn/bili/src/${packKey}/${target.alt}.${pack.type})`;
            //     textarea.focus();
            // }
        });

        containerDiv.appendChild(container);
    }

    // 向编辑器中插入图片链接
    function insertToEditor(imgLink) {
        const codeMirrorElement = document.querySelector('.CodeMirror');
        if (codeMirrorElement) {
            const codeMirrorInstance = codeMirrorElement.CodeMirror;
            if (codeMirrorInstance) {
                const cursor = codeMirrorInstance.getCursor();
                codeMirrorInstance.replaceRange(`  ![表情包](${imgLink})  `, cursor);
            }
        }
    }

    // 监视表情包显示容器的变化, 防止同时打开官方和自定义
    function monitorExpContainerChanges() {
        // 选择要观察变动的节点
        const targetNode = document.querySelector('.exp-container');

        // 创建一个回调函数来接收变动通知
        const callback = function (mutationsList, observer) {
            // 检查.exp-container的innerHTML是否不包含'<!---->'即打开了官方表情包
            if (!targetNode.innerHTML.includes('<!---->')) {
                clearEmotions(); // 防止官方和自定义同时存在
                // 遍历所有.expression .custom-emotion类的元素并禁用
                // const customEmotions = document.querySelectorAll('.expression .custom-emotion');
                // customEmotions.forEach(element => {
                //     element.disabled = true; // 这里假设这些元素是可以被禁用的，比如按钮
                //     // 如果元素不能直接被禁用，可能需要添加逻辑来处理（比如添加一个类或属性来表示禁用状态）
                // });
            }
        };

        // 创建MutationObserver实例并传入回调函数
        const observer = new MutationObserver(callback);

        // 使用配置对象指定要观察的变动类型
        const config = { childList: true, subtree: true, characterData: true };

        // 开始观察目标节点
        observer.observe(targetNode, config);

        // 注意：在某个时刻，你可能需要停止观察
        // observer.disconnect();
    }

})();
