import * as calendarModel from '../models/calendarModel'

export async function checkRefreshToken(input: any) {
    return calendarModel.checkRefreshToken({
        user_id: input.user_id
    });
}

export async function updateRefreshToken(input: any) {
    return calendarModel.updateToken({
        user_id: input.user_id,
        refresh_token: input.refresh_token,
    })
}