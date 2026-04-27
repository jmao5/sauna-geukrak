// Spring Boot Page 객체 구조 대응
export interface PageResponse<T> {
  content: T[]
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/**
 * 백엔드 공통 응답 래퍼
 * apiInstance가 자동으로 언래핑하므로 API 함수 제네릭에는 data 타입만 지정하면 됩니다.
 * ex) apiInstance<UserData>('/users') → UserData 반환
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
}
