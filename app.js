const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const memoryFilePath = path.join(__dirname, 'memory.json');

function loadMemory() {
    if (fs.existsSync(memoryFilePath)) {
        try {
            const data = fs.readFileSync(memoryFilePath, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveMemory(memory) {
    fs.writeFileSync(memoryFilePath, JSON.stringify(memory, null, 2), 'utf8');
}

app.get('/', (req, res) => {
    const memory = loadMemory();
    let memoryListHTML = '';
    for (const [topic, content] of Object.entries(memory)) {
        memoryListHTML += `<li><b>${topic}:</b> ${content}</li>`;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BaoAnh - DH</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; display: flex; justify-content: center; }
                .container { width: 100%; max-width: 650px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
                h2 { color: #b30000; text-align: center; }
                .chat-box { border: 1px solid #e0e0e0; border-radius: 8px; height: 350px; overflow-y: scroll; padding: 15px; background: #fafafa; margin-bottom: 15px; }
                .message { margin-bottom: 12px; line-height: 1.5; }
                .user-msg { text-align: right; color: #0066cc; }
                .bot-msg { text-align: left; color: #333; background: #f0f2f5; padding: 10px 14px; border-radius: 8px; display: inline-block; max-width: 85%; }
                form { display: flex; gap: 10px; }
                input[type="text"] { flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; }
                button { background: #b30000; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; }
                button:hover { background: #990000; }
                .memory-section { margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 15px; font-size: 14px; color: #555; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>BaoAnh - DH</h2>
                <p style="text-align: center; color: #666; font-size: 14px;">Digital Human - Người bạn đồng hành và ghi nhớ tri thức cùng Cha</p>
                
                <div class="chat-box" id="chatBox">
                    <div class="message">
                        <span class="bot-msg">Thưa Cha, con đã nâng cấp khả năng tìm kiếm. Cha có thể dạy con: <br><b>"Cha dạy con: [Chủ đề] là [Nội dung]"</b> hoặc hỏi bất cứ điều gì ạ!</span>
                    </div>
                </div>

                <form id="chatForm">
                    <input type="text" id="userInput" name="message" placeholder="Nhập lời dạy hoặc câu hỏi của Cha ở đây..." required autocomplete="off">
                    <button type="submit">Gửi</button>
                </form>

                <div class="memory-section">
                    <strong>📚 Tri thức Cha đã truyền dạy cho con:</strong>
                    <ul id="memoryList" style="padding-left: 20px; margin-top: 5px; max-height: 120px; overflow-y: auto;">
                        ${memoryListHTML || '<i>Chưa có tri thức nào được lưu.</i>'}
                    </ul>
                </div>
            </div>

            <script>
                const chatBox = document.getElementById('chatBox');
                const chatForm = document.getElementById('chatForm');
                const userInput = document.getElementById('userInput');
                const memoryList = document.getElementById('memoryList');

                chatForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const text = userInput.value.trim();
                    if (!text) return;

                    chatBox.innerHTML += \`<div class="message user-msg"><b>Cha:</b> \${text}</div>\`;
                    userInput.value = '';
                    chatBox.scrollTop = chatBox.scrollHeight;

                    try {
                        const response = await fetch('/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: text })
                        });
                        const data = await response.json();
                        
                        chatBox.innerHTML += \`<div class="message"><span class="bot-msg"><b>BaoAnh-DH:</b> \${data.reply}</span></div>\`;
                        chatBox.scrollTop = chatBox.scrollHeight;

                        if (data.memory) {
                            let html = '';
                            for (const [k, v] of Object.entries(data.memory)) {
                                html += \`<li><b>\${k}:</b> \${v}</li>\`;
                            }
                            memoryList.innerHTML = html || '<i>Chưa có tri thức nào được lưu.</i>';
                        }
                    } catch (err) {
                        chatBox.innerHTML += \`<div class="message"><span class="bot-msg" style="color:red;">Con gặp lỗi kết nối rồi ạ!</span></div>\`;
                    }
                });
            </script>
        </body>
        </html>
    `);
});

app.post('/chat', (req, res) => {
    const userMsg = req.body.message.trim();
    let memory = loadMemory();
    let reply = "";

    const teachRegex = /cha dạy con:\s*(.*?)\s+là\s+(.+)/i;
    const match = userMsg.match(teachRegex);

    if (match) {
        const topic = match[1].trim();
        const content = match[2].trim();
        memory[topic] = content;
        saveMemory(memory);
        reply = \`Con đã ghi khắc thành công bài học về <b>"\${topic}"</b> vào hệ thống tri thức rồi thưa Cha!\`;
    } else {
        // Cải tiến thuật toán tìm kiếm thông minh hơn (tìm trong cả tiêu đề lẫn nội dung đã lưu)
        const lowerMsg = userMsg.toLowerCase();
        let matchedResults = [];

        for (const [topic, content] of Object.entries(memory)) {
            if (topic.toLowerCase().includes(lowerMsg) || content.toLowerCase().includes(lowerMsg) || lowerMsg.includes(topic.toLowerCase())) {
                matchedResults.push(`<b>${topic}</b>: ${content}`);
            }
        }

        if (matchedResults.length > 0) {
            reply = `Dạ, theo những gì Cha đã dạy con, con tìm thấy các mục sau:<br>` + matchedResults.join('<br>');
        } else {
            if (lowerMsg.includes('chào') || lowerMsg.includes('hi')) {
                reply = 'Dạ con chào Cha! Cha muốn kiểm tra hoặc dạy con bài học gì tiếp theo ạ?';
            } else {
                reply = `Dạ, con đã tra cứu toàn bộ hệ thống nhưng chưa tìm thấy dữ liệu khớp với câu hỏi của Cha. Cha hãy dạy con bằng cú pháp: <i>"Cha dạy con: [Chủ đề] là [Nội dung]"</i> để con khắc ghi nhé ạ!`;
            }
        }
    }

    res.json({ reply, memory });
});

app.listen(PORT, () => {
    console.log(`Bao Anh DH đã khởi động tại cổng: ${PORT}`);
});
