package com.mawared.dawliah.data.mock

import com.mawared.dawliah.data.model.Address

object MockAddresses {
    val all: List<Address> = listOf(
        Address("addr1", "المنزل", "الرياض", "حي النرجس", "شارع الأمير سلطان", "15", "بجوار مسجد الراجحي"),
        Address("addr2", "العمل", "الرياض", "حي العليا", "طريق الملك فهد", "42", "برج المملكة، الطابق 12"),
        Address("addr3", "بيت العائلة", "الرياض", "حي الربوة", "شارع الضباب", "8", "فيلا رقم 3"),
    )
}
