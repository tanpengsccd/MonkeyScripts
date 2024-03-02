// ==UserScript==
// @name         NodeSeek 编辑器增强
// @namespace    https://www.nodeseek.com/
// @version      0.0.2
// @description  为 NodeSeek 编辑器增加图片上传功能
// @author       TomyJan
// @match        *://www.nodeseek.com/*
// @icon         https://www.nodeseek.com/static/image/favicon/android-chrome-192x192.png
// @grant        GM_xmlhttpRequest
// @license      MPL-2.0 License
// @supportURL   https://www.nodeseek.com/post-?-1
// @homepageURL  https://www.nodeseek.com/post-?-1
// @downloadURL  https://update.greasyfork.org/scripts/487553/NodeSeek%20%E7%BC%96%E8%BE%91%E5%99%A8%E5%A2%9E%E5%BC%BA.user.js
// @updateURL    https://update.greasyfork.org/scripts/487553/NodeSeek%20%E7%BC%96%E8%BE%91%E5%99%A8%E5%A2%9E%E5%BC%BA.meta.js
// ==/UserScript==

/**
 * 
 * 
 * 当前版本更新日志
 * 0.0.2 - 2024.03.02          !!!更新前注意备份您的配置!!! 
 * - 支持 拖放文件上传
 */

(function () {
    'use strict';

    // 图床配置, 默认提供的是这位大佬的 https://www.nodeseek.com/post-38305-1 , 这个图床上传限制 5p / IP / 小时
    const imgHost = {
        type: "LskyPro", // 图床类型, 暂只支持 LskyPro
        url: "https://image.dooo.ng", // 图床地址, 带上协议头
        token: null, // 图床 token, 可选, 不填则为游客上传, 在 /user/tokens 生成
        storageId: null, // 图床存储策略ID, 可选项, 不填则为默认策略, 普通用户可在上传页抓包得到, 管理员可以在后台看到
    };
    const mdImgName = 0; // 0: 使用图床返回的原始名称, 其他值则名称固定为该值

    // 页面加载完毕后载入功能
    window.addEventListener('load', initEditorEnhancer, false);

    function initEditorEnhancer() {
        // 监听粘贴事件
        document.addEventListener('paste', (event) => handlePasteEvt(event));

        

        // 给编辑器绑定拖拽事件
        var dropZone = document.getElementById('code-mirror-editor');
        // 阻止默认行为
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy'; // 显示为复制图标
        });

        // 处理文件拖放
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();

            log('正在处理拖放内容...');
            let imageFiles = [];
            for(let file of e.dataTransfer.files) {
                if (/^image\//i.test(file.type)) { // 确保只处理图片文件
                    imageFiles.push(file);
                    log(`拖放的文件名: ${file.name}`);
                }
            }
            log(`拖放的图片数量: ${imageFiles.length}`);
            if (imageFiles.length === 0) {
                log('你拖放的内容好像没有图片哦', 'red');
                return;
            }

            // 调整uploadImage函数以接受File对象数组而不是DataTransferItemList
            uploadImage(imageFiles.map(file => {
                return {
                    kind: 'file',
                    type: file.type,
                    getAsFile: () => file
                };
            }));
        });
    }

    // 粘贴事件处理
    function handlePasteEvt(event) {
        log('正在处理粘贴内容...');
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        if (items.length === 0) {
            log('你粘贴的内容好像没有图片哦', 'red');
            return;
        }
        uploadImage(items)
    }

    // 处理并上传图片
    function uploadImage(items) {
        let imageFiles = [];

        for (let item of items) {
            if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                let blob = item.getAsFile();
                imageFiles.push(blob);
            }
        }

        if (imageFiles.length > 0) {
            event.preventDefault();
            for (let i = 0; i < imageFiles.length; i++) {
                if (imageFiles.length >1)
                    log(`上传第 ${i + 1} / ${imageFiles.length} 张图片...`);
                else
                    log(`上传图片...`);
                let file = imageFiles[i];
                let formData = new FormData();
                formData.append('file', file);
                if (imgHost.storageId) formData.append('strategy_id', imgHost.storageId);
                if (imgHost.type === 'LskyPro') {
                    uploadToLsky(formData);
                } else {
                    log(`暂不支持的图床类型: ${imgHost.type}, 取消上传`, 'red');
                    return;
                }
            }
            
        } else {
            log('你粘贴的内容好像没有图片哦', 'red');
        }
    }

    function uploadToLsky(formData) {
        return new Promise((resolve, reject) => {
            let headers = {
                'Accept': 'application/json'
            };
            if (imgHost.token)
                headers['Authorization'] = `Bearer ${imgHost.token}`;
            
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${imgHost.url}/api/v1/upload`,
                headers: headers,
                data: formData,
                onload: (rsp) => {
                    let rspJson = JSON.parse(rsp.responseText);
                    if(rsp.status !== 200) {
                        log(`图片上传失败: ${rsp.status} ${rsp.statusText}`, 'red');
                        reject(rspJson.message);
                    }
                    if (rspJson.status === true) {
                        // 图片上传成功
                        if(rspJson?.data?.links?.markdown)
                            insertToEditor(mdImgName === 0 ? rspJson.data.links.markdown : `![${mdImgName}](${rspJson.data.links.url})`);
                        else {
                            log('图片上传成功, 但接口返回有误, 原始返回已粘贴到编辑器', 'red');
                            insertToEditor(`![${file.name}](${rspJson.data.url})`);
                        }
                    } else
                        log(`图片上传失败: ${rspJson.message}`, 'red');
                    resolve();
                },
                onerror: (error) => {
                    log(`图片上传失败: ${error.status} ${error.statusText}`, 'red');
                    reject(error);
                }
            });
        });
    }

    function insertToEditor(markdownLink) {
        const codeMirrorElement = document.querySelector('.CodeMirror');
        if (codeMirrorElement) {
            const codeMirrorInstance = codeMirrorElement.CodeMirror;
            if (codeMirrorInstance) {
                const cursor = codeMirrorInstance.getCursor();
                codeMirrorInstance.replaceRange(`\n${markdownLink} \n`, cursor);
            }
        }
        if (markdownLink.startsWith('!['))
            log('图片已插入到编辑器~', 'green');
    }

    // 在编辑器打印日志
    function log(message, color = '') {
        if(!document.getElementById('editor-enhance-logs')) {
            initEditorLogDiv();
        }
        const logDiv = document.getElementById('editor-enhance-logs');
        logDiv.innerHTML = `<div${color ? ` style="color: ${color};` : ''}">&nbsp;&nbsp;&nbsp;${message}&nbsp;</div>`;

        console.log(`[NodeSeek-Editor-Enhance] ${message}`);
    }

    // 初始化显示日志的容器
    function initEditorLogDiv() {
        const logDiv = document.createElement('div');
        logDiv.id = 'editor-enhance-logs';
        logDiv.innerHTML = '';
        document.body.appendChild(logDiv);

        const editorToolbarDiv = document.querySelector('.mde-toolbar');
        editorToolbarDiv.appendChild(logDiv);
    }

})();
