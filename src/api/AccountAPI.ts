import axios from "axios";

const { ACCOUNT_API_URL } = process.env

const AccountAPI = axios.create({
    baseURL: ACCOUNT_API_URL
})

export default AccountAPI