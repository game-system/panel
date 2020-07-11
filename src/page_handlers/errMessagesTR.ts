import { Err } from "tombalaApi";
export default function TranslateError(err: Err): [string, string | undefined] {
	if (typeof err === 'string') {
		switch (err) {
			case 'NotFound':
				return ['Bulunamadı', undefined];
			case 'CardIndexNotFound':
				return ['Kart İndex`i bulunamadı', undefined];
			case 'InvalidParent':
				return ['Geçersiz Ebeveyn', undefined];
			case 'AlreadyExists':
				return ['Zaten Mevcut', undefined];
			case 'NothingToUpdate':
				return ['Güncellenecek bir şey yok', undefined];
			case 'InvalidCreds':
				return ['Giriş Bilgileri Geçersiz', undefined];
			case 'ExecutionCancelled':
				return ['İşlem iptal edildi', undefined];
			case 'InsufficientCredit':
				return ['Yetersiz Kredi', undefined];
			case 'InsufficientPermissions':
				return ['İzniniz yok', undefined];
			case 'InvalidGameType':
				return ['Geçersiz Oyun Tipi', undefined];
			case 'InvalidTombalaBall':
				return ['Geçersiz Tombala Topu', undefined];
			case 'PoisonError':
				return ['Zehir Hatası', undefined];
			case 'UserDisabled':
				return ['Engellenmiş Kullanıcı', undefined];
			case 'NoTombalaBallInQueue':
				return ['Kuyrukta tombala topu yok', undefined];
			case 'InvalidCardData':
				return ['Geçersiz Kart Datası', undefined];
			default:
				return [err, undefined];
		}
	}
	else if (typeof err === 'object') {
		const key = Object.keys(err)[0];
		const anyErr: any = err;
		switch (key) {
			case 'DBInitError':
				return ['Veritabanı Başlangıç Hatası', anyErr[key]];
			case 'DBErr':
				return ['Veritabanı Hatası', anyErr[key]];
			case 'ConfigErr':
				return ['Ayar Hatası', anyErr[key]];
			case 'ConnErr':
				return ['Bağlantı Hatası', anyErr[key]];
			case 'Unknown':
				return ['Hata', anyErr[key]];
			case 'RedisError':
				return ['Redis Hatası', anyErr[key]];
			case 'JsonError':
				return ['JSON Hatası', anyErr[key]];
			case 'GameError':
				return ['Oyun Hatası', anyErr[key]];
			case 'MissingField':
				return ['Eksik Veri Hatası', anyErr[key]];
			case 'InvalidField':
				return ['Geçersiz Veri Hatası', anyErr[key]];
			default:
				return [key, anyErr[key]];
		}
	}
	else {
		return [JSON.stringify(err), undefined];
	}

}
