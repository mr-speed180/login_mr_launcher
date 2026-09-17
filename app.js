const GIST_ID = "d39503f6c557dad931747b6936c2fdb2"; // ضع رقم الـ Gist هنا (مثل: d39503f6c557dad931747b6936c2fdb2)
const GITHUB_TOKEN = "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"; // ضع الـ Personal Access Token الخاص بك هنا
const FILENAME = "users.json"; // اسم الملف داخل الـ Gist الذي سيحفظ البيانات

const form = document.getElementById("signupForm");
const statusMessage = document.getElementById("statusMessage");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        statusMessage.style.color = "#f87171";
        statusMessage.textContent = "الرجاء تعبئة جميع الحقول!";
        return;
    }

    submitBtn.disabled = true;
    statusMessage.style.color = "#fbbf24";
    statusMessage.textContent = "جاري إنشاء الحساب...";

    try {
        // 1. جلب البيانات القديمة من الـ Gist أولاً لكي لا نحذف المستخدمين السابقين
        const getResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        if (!getResponse.ok) throw new Error("فشل في الاتصال بـ Gist");
        
        const gistData = await getResponse.json();
        
        // التحقق مما إذا كان الملف موجوداً مسبقاً في الـ Gist
        let existingUsers = [];
        if (gistData.files && gistData.files[FILENAME]) {
            try {
                existingUsers = JSON.parse(gistData.files[FILENAME].content);
            } catch (err) {
                existingUsers = []; // لو الملف فارغ أو ليس بصيغة JSON صحيحة
            }
        }

        // 2. التحقق إن كان اسم المستخدم موجود مسبقاً
        const userExists = existingUsers.some(user => user.username === username);
        if (userExists) {
            statusMessage.style.color = "#f87171";
            statusMessage.textContent = "اسم المستخدم موجود مسبقاً، اختر اسمًا آخر.";
            submitBtn.disabled = false;
            return;
        }

        // 3. إضافة المستخدم الجديد للقائمة
        existingUsers.push({ username: username, password: password });

        // 4. إرسال القائمة المحدثة إلى الـ Gist عبر Patch Request
        const updateResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: "PATCH",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                files: {
                    [FILENAME]: {
                        content: JSON.stringify(existingUsers, null, 2)
                    }
                }
            })
        });

        if (updateResponse.ok) {
            statusMessage.style.color = "#4ade80";
            statusMessage.textContent = "تم إنشاء الحساب وحفظه بنجاح!";
            form.reset();
        } else {
            throw new Error("فشل تحديث البيانات في Gist");
        }

    } catch (error) {
        console.error(error);
        statusMessage.style.color = "#f87171";
        statusMessage.textContent = "حدث خطأ أثناء الاتصال بالخادم.";
    } finally {
        submitBtn.disabled = false;
    }
});
