"use strict";
const messages=Object.freeze({INVALID_REQUEST:'The request is not valid.',PATH_DENIED:'Choose this file or folder explicitly. Links and hidden paths are not allowed.',PERMISSION_DENIED:'This window does not have permission.',CANCELLED:'This operation was cancelled.',UNSUPPORTED:'This file type requires a host editor.',TOO_LARGE:'This file exceeds the preview size limit.',NOT_FOUND:'This file is no longer available.',INVALID_TEXT:'This file is not valid UTF-8 text.',BUSY:'Another operation is running.',DIRTY_DOCUMENT:'Save or discard changes before closing this document.',IO_FAILED:'The operation could not be completed.'});
class AppError extends Error{constructor(code){super(messages[code]||messages.IO_FAILED);this.name='AppError';this.code=messages[code]?code:'IO_FAILED';}}
function fail(code){throw new AppError(code);}
function publicError(error){const code=error instanceof AppError?error.code:error?.code==='ENOENT'?'NOT_FOUND':error?.name==='AbortError'?'CANCELLED':'IO_FAILED';return{code,message:messages[code]};}
module.exports={AppError,fail,publicError};
