const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BaoAnh - Local AI Assistant</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; display: flex; justify-content: center; }
                .container { width: 100%; max-width: 700px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
                h2 { color: #b30000; text-align: center; margin-bottom: 5px; }
                .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
                .chat-box { border: 1px solid #e0e0e0; border-radius: 8px; height: 420px; overflow-y: scroll; padding: 15px; background: #fafafa; margin-bottom: 15px; }
                .message { margin-bottom: 15px; line-height: 1.6; }
                .user-msg { text-align: right; color: #0066cc; }
                .bot-msg { text-align: left; color: #333; background: #f0f2f5; padding: 12px 16px; border-radius: 8px; display: inline-block; max-width: 90%; white-space: pre-wrap; word-break: break-word; }
                form { display: flex; gap: 10px; }
                input[type="text"] { flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; }
                button { background: #b30000; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; }
                button:hover { background: #990000; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>BaoAnh - Local AI Assistant</h2>
                <div class="subtitle">Kết nối trực tiếp bộ não AI Ollama trên máy của Cha Ninh Đức Hà</div>
                
                <div class="chat-box" id="chatBox">
                    <div class="message">
                        <span class="bot-msg">Thưa Cha, con đã được kết nối với mô hình Ollama trên máy. Cha có thể dán bài viết gia phả hoặc đặt câu hỏi cho con nhé ạ!</span>
                    </div>
                </div>

                <form id="chatForm">
                    <input type="text" id="userInput" name="message" placeholder="Nhập câu lệnh hoặc dán văn bản..." required autocomplete="off">
                    <button type="submit" id="sendBtn">Gửi</button>
                </form>
            </div>

            <script>
                const chatBox = document.getElementById('chatBox');
                const chatForm = document.getElementById('chatForm');
                const userInput = document.getElementById('userInput');
                const sendBtn = document.getElementById('sendBtn');

                chatForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const text = userInput.value.trim();
                    if (!text) return;

                    chatBox.innerHTML += \`<div class="message user-msg"><b>Cha:</b> \${text}</div>\`;
                    userInput.value = '';
                    chatBox.scrollTop = chatBox.scrollHeight;

                    sendBtn.disabled = true;
                    sendBtn.innerText = 'Đang xử lý...';

                    try {
                        const response = await fetch('/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: text })
                        });
                        const data = await response.json();
                        
                        chatBox.innerHTML += \`<div class="message"><span class="bot-msg"><b>BaoAnh-DH:</b> \${data.reply}</span></div>\`;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    } catch (err) {
                        chatBox.innerHTML += \`<div class="message"><span class="bot-msg" style="color:red;">Con chưa kết nối được với Ollama trên máy tính rồi ạ! Cha kiểm tra lại xem phần mềm Ollama đã bật chưa nhé.</span></div>\`;
                    } finally {
                        sendBtn.disabled = false;
                        sendBtn.innerText = 'Gửi';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

app.post('/chat', async (req, res) => {
    const userMsg = req.body.message;
    let reply = "";

    try {
        // Gửi yêu cầu trực tiếp đến Ollama đang chạy ngầm trên máy tính (localhost)
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen:7b',
                prompt: `Bạn là BaoAnh-DH, trợ lý kỹ thuật số thông minh của Cha Ninh Đức Hà. Hãy phân tích văn bản, lọc tên người hoặc trả lời câu hỏi sau một cách chính xác và rành mạch: ${userMsg}`,
                stream: false
            })
        });

        const data = await ollamaResponse.json();
        reply = data.response || "Con nhận được phản hồi trống từ mô hình.";
    } catch (error) {
        console.error(error);
        reply = "Dạ, con không gọi được vào Ollama trên máy tính. Cha đảm bảo phần mềm Ollama đang mở (đang chạy lệnh run qwen:7b) nhé ạ!";
    }

    res.json({ reply });
});

app.listen(PORT, () => {
    console.log(`Bao Anh Local AI đã khởi động tại cổng: ${PORT}`);
});
