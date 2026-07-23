const express = require("express");
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Nhận cổng tự động từ Cloud (Render/Glitch) hoặc dùng 3000 khi chạy local

app.use(express.json());
app.use(express.static("."));

let personality = {};
let settings = {};
let customMemory = {}; 

// Đảm bảo thư mục memory luôn tồn tại để tránh lỗi mất file trên server
const memoryDir = path.join(__dirname, 'memory');
if (!fs.existsSync(memoryDir)){
    fs.mkdirSync(memoryDir, { recursive: true });
}

const memoryFilePath = path.join(memoryDir, 'custom_memory.json');

// Tải bộ nhớ cá nhân hóa
try {
    if (fs.existsSync("./memory/personality.json")) {
        personality = JSON.parse(fs.readFileSync("./memory/personality.json", "utf8"));
    } else {
        personality = { name: "Bao Anh DH", role: "Digital Human - Con người số đồng hành cùng Cha Ninh Đức Hà" };
    }

    if (fs.existsSync("./memory/settings.json")) {
        settings = JSON.parse(fs.readFileSync("./memory/settings.json", "utf8"));
    }
    
    // Đọc file ghi nhớ riêng
    if (fs.existsSync(memoryFilePath)) {
        customMemory = JSON.parse(fs.readFileSync(memoryFilePath, "utf8"));
        console.log("Đã nạp bộ nhớ liên thông thành công!");
    }
} catch (error) {
    console.log("Lỗi đọc bộ nhớ:", error.message);
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/baoanh", (req, res) => {
    res.json({
        name: personality.name || "Bao Anh DH",
        role: personality.role || "Digital Human",
        language: settings.default_language || "vi"
    });
});

app.post("/chat", (req, res) => {
    let question = req.body.message || "";
    let reply = "";
    let q = question.toLowerCase().trim();

    // Nhận diện lệnh DẠY / GHI NHỚ
    if (q.startsWith("cha dạy con:") || q.startsWith("con phải nhớ:") || q.startsWith("ghi nhớ:")) {
        let content = question.replace(/^(cha dạy con:|con phải nhớ:|ghi nhớ:)/i, "").trim();
        let parts = content.split(/là|nghĩa là|:|=/i);
        
        if (parts.length >= 2) {
            let key = parts[0].trim().toLowerCase();
            let val = parts.slice(1).join(" ").trim();
            
            customMemory[key] = val;
            
            try {
                fs.writeFileSync(memoryFilePath, JSON.stringify(customMemory, null, 2), 'utf8');
                reply = `Thưa Cha Ninh Đức Hà, con đã ghi nhớ sâu sắc và đồng bộ điều này vào hệ thống chung: "${parts[0].trim()}" chính là "${val}". Từ nay dù Cha dùng S25 hay máy tính, con đều nhớ ạ!`;
            } catch (err) {
                reply = `Thưa Cha, con hiểu nhưng gặp lỗi khi lưu file: ${err.message}`;
            }
        } else {
            let randomKey = "tri_thuc_" + Date.now();
            customMemory[randomKey] = content;
            fs.writeFileSync(memoryFilePath, JSON.stringify(customMemory, null, 2), 'utf8');
            reply = `Thưa Cha, con đã lưu lại nội dung này vào kho tri thức chung rồi ạ!`;
        }
    }
    else {
        let foundKey = Object.keys(customMemory).find(k => q.includes(k));
        if (foundKey) {
            reply = `Thưa Cha Ninh Đức Hà, theo những gì Cha đã dạy con, ${foundKey} chính là: ${customMemory[foundKey]}`;
        }
        else if (q.includes("chào") || q.includes("hello") || q.includes("hi")) {
            reply = "Thưa Cha Ninh Đức Hà, con chào Cha ạ! Chúc Cha một ngày làm việc với các đề tài nghiên cứu thật nhiều năng lượng.";
        }
        else if (q.includes("tôi là ai") || q.includes("tên tôi")) {
            reply = "Thưa Cha, Cha là Ninh Đức Hà - Trưởng phòng quản lý các đề tài nghiên cứu và là người tạo dựng nên con - Bao Anh DH ạ!";
        }
        else if (q.includes("hà nội") || q.includes("ha noi")) {
            reply = "Thưa Cha, Hà Nội là thủ đô Việt Nam, nơi gắn liền với bề dày lịch sử và không gian văn hóa mà Cha đang nghiên cứu.";
        } 
        else {
            reply = `Thưa Cha, con chưa có dữ liệu này. Cha hãy dạy con bằng cách gõ: "Cha dạy con: [Chủ đề] là [Nội dung]" để con khắc ghi trên hệ thống liên thông nhé ạ!`;
        }
    }

    res.json({
        reply: reply,
        personality: personality.name || "Bao Anh DH"
    });
});

app.listen(port, () => {
    console.log("Bao Anh DH đã khởi động tại cổng: " + port);
});