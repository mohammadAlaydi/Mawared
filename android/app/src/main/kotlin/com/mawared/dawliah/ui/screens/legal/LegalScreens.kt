package com.mawared.dawliah.ui.screens.legal

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mawared.dawliah.ui.components.MawaredTopBar
import com.mawared.dawliah.ui.theme.*

@Composable
fun TermsScreen(onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(SurfaceWhite)) {
        MawaredTopBar(title = "الشروط والأحكام", onBackClick = onBack)
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            LegalSection("المقدمة", "مرحباً بك في منصة موارد الدولية لتأجير العمالة. باستخدامك لهذا التطبيق، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.")
            LegalSection("الخدمات", "تقدم منصة موارد الدولية خدمات تأجير العمالة المنزلية والسائقين ومقدمي الرعاية في المملكة العربية السعودية. تشمل الخدمات التأجير بالساعة والتأجير الشهري.")
            LegalSection("التزامات المستخدم", "يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عند التسجيل. يجب إتمام عملية التحقق من الهوية قبل تقديم أول طلب.")
            LegalSection("الدفع والاسترداد", "يتم الدفع عبر البطاقات البنكية المعتمدة. في حالة إلغاء الطلب خلال 24 ساعة، يتم استرداد المبلغ كاملاً. بعد ذلك قد تطبق رسوم إلغاء.")
            LegalSection("حقوق الملكية الفكرية", "جميع حقوق الملكية الفكرية للمنصة والمحتوى المعروض فيها محفوظة لشركة موارد الدولية.")
            LegalSection("القانون المعمول به", "تخضع هذه الشروط والأحكام لأنظمة المملكة العربية السعودية.")
        }
    }
}

@Composable
fun PrivacyScreen(onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(SurfaceWhite)) {
        MawaredTopBar(title = "سياسة الخصوصية", onBackClick = onBack)
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            LegalSection("جمع البيانات", "نقوم بجمع البيانات الشخصية التالية: الاسم الكامل، رقم الهاتف، عنوان البريد الإلكتروني، والعنوان. هذه البيانات ضرورية لتقديم خدماتنا.")
            LegalSection("استخدام البيانات", "نستخدم بياناتك لمعالجة الطلبات، التواصل معك، وتحسين تجربة المستخدم. لا نشارك بياناتك مع أطراف ثالثة بدون موافقتك.")
            LegalSection("أمن البيانات", "نستخدم أحدث تقنيات التشفير والأمان لحماية بياناتك الشخصية والمالية.")
            LegalSection("حقوق المستخدم", "لديك الحق في الوصول إلى بياناتك أو تعديلها أو حذفها في أي وقت من خلال إعدادات الحساب أو التواصل مع فريق الدعم.")
            LegalSection("ملفات تعريف الارتباط", "قد نستخدم ملفات تعريف الارتباط لتحسين تجربة الاستخدام وتحليل أنماط الاستخدام.")
        }
    }
}

@Composable
private fun LegalSection(title: String, content: String) {
    Text(title, style = MaterialTheme.typography.headlineMedium, color = TextPrimary, modifier = Modifier.padding(top = 16.dp, bottom = 4.dp))
    Text(content, style = MaterialTheme.typography.bodyLarge, color = TextSecondary, modifier = Modifier.padding(bottom = 12.dp))
}
