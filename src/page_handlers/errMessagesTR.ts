import { Err } from "tombalaApi";
export default function TranslateError(err: Err): [string, string | undefined] {
  if (typeof err === 'string') {
    switch (err) {
      case 'NotFound':
        return ['Bulunamadı', undefined];
        break;
      case 'CardIndexNotFound':
        return ['Kart İndex`i bulunamadı', undefined];
        break;
      case 'InvalidParent':
        return ['Geçersiz Ebeveyn', undefined];
        break;
      case 'AlreadyExists':
        return ['Zaten Mevcut', undefined];
        break;
      case 'NothingToUpdate':
        return ['Güncellenecek bir şey yok', undefined];
        break;
      case 'InvalidCreds':
        return ['Geçersiz Kredi', undefined];
        break;
      case 'ExecutionCancelled':
        return ['İşlem iptal edildi', undefined];
        break;
      case 'InsufficientCredit':
        return ['Yetersiz Kredi', undefined];
        break;
      case 'InsufficientPermissions':
        return ['İzniniz yok', undefined];
        break;
      case 'InvalidGameType':
        return ['Geçersiz Oyun Tipi', undefined];
        break;
      case 'InvalidTombalaBall':
        return ['Geçersiz Tombala Topu', undefined];
        break;
      case 'PoisonError':
        return ['Zehir Hatası', undefined];
        break;
      case 'UserDisabled':
        return ['Engellenmiş Kullanıcı', undefined];
        break;
      case 'NoTombalaBallInQueue':
        return ['Kuyrukta tombala topu yok', undefined];
        break;
      case 'InvalidCardData':
        return ['Geçersiz Kart Datası', undefined];
        break;
      default:
        return [err, undefined];
        break;
    }
  }
  else if (typeof err === 'object') {
    const key = Object.keys(err)[0];
    const anyErr: any = err;
    switch (key) {
      case 'DBInitError':
        return ['Veritabanı Başlangıç Hatası', anyErr[key]];
        break;
      case 'DBErr':
        return ['Veritabanı Hatası', anyErr[key]];
        break;
      case 'ConfigErr':
        return ['Ayar Hatası', anyErr[key]];
        break;
      case 'ConnErr':
        return ['Bağlantı Hatası', anyErr[key]];
        break;
      case 'Unknown':
        return ['Hata', anyErr[key]];
        break;
      case 'RedisError':
        return ['Redis Hatası', anyErr[key]];
        break;
      case 'JsonError':
        return ['JSON Hatası', anyErr[key]];
        break;
      case 'GameError':
        return ['Oyun Hatası', anyErr[key]];
        break;
      case 'MissingField':
        return ['Eksik Veri Hatası', anyErr[key]];
        break;
      case 'InvalidField':
        return ['Geçersiz Veri Hatası', anyErr[key]];
        break;
      default:
        return [key, anyErr[key]];
        break;

    }
  }
  else {
    return [JSON.stringify(err), undefined];
  }

}