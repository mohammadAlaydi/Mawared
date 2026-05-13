package com.mawared.dawliah.data.remote

import com.mawared.api.ApiProblem
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import retrofit2.HttpException
import java.io.IOException

/**
 * Translates any thrown Retrofit / OkHttp exception into a user-facing
 * Arabic error message. The backend uses RFC 7807 problem+json, so we
 * try to parse `code` + `detail` first; otherwise fall back to status
 * code or network-level errors.
 */
object ApiErrors {

    private val moshi: Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val problemAdapter = moshi.adapter(ApiProblem::class.java)

    fun toMessage(throwable: Throwable): String = when (throwable) {
        is HttpException -> mapHttp(throwable)
        is IOException -> "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت."
        else -> throwable.message ?: "حدث خطأ غير متوقع."
    }

    private fun mapHttp(ex: HttpException): String {
        val body = runCatching { ex.response()?.errorBody()?.string() }.getOrNull()
        val problem = body?.let { runCatching { problemAdapter.fromJson(it) }.getOrNull() }
        if (problem != null) {
            // Domain-specific Arabic labels for common error codes.
            return when (problem.code) {
                "AUTH_INVALID_OTP" -> "رمز التحقق غير صحيح."
                "AUTH_OTP_EXPIRED" -> "انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً."
                "AUTH_INVALID_CREDENTIALS" -> "بيانات الدخول غير صحيحة."
                "AUTH_ACCOUNT_LOCKED" -> "تم قفل الحساب مؤقتاً."
                "AUTH_ACCOUNT_DEACTIVATED" -> "هذا الحساب موقوف."
                "RATE_LIMIT_EXCEEDED" -> "محاولات كثيرة. الرجاء الانتظار قليلاً."
                "VERIFICATION_REQUIRED" -> "يجب إكمال التحقق من الهوية أولاً."
                "WORKER_NOT_AVAILABLE" -> "هذا العامل لم يعد متاحاً."
                else -> problem.detail.ifBlank { "حدث خطأ. (${problem.code})" }
            }
        }
        return when (ex.code()) {
            401 -> "انتهت الجلسة. سجّل الدخول مجدداً."
            403 -> "ليست لديك صلاحية لهذا الإجراء."
            404 -> "العنصر غير موجود."
            429 -> "محاولات كثيرة. الرجاء الانتظار قليلاً."
            in 500..599 -> "خطأ في الخادم. الرجاء المحاولة لاحقاً."
            else -> "خطأ HTTP ${ex.code()}."
        }
    }
}
