import { usePublicCourses } from "../../hooks/courses/usePublicCourses";
import { useCourseFilters } from "../../hooks/courses/useCourseFilters";
import CoursesHero from "../../components/courses/CoursesHero";
import CourseCategoryFilter from "../../components/courses/CourseCategoryFilter";
import CourseGrid from "../../components/courses/CourseGrid";
import CourseSkeleton from "../../components/courses/CourseSkeleton";
import CourseEmptyState from "../../components/courses/CourseEmptyState";
import CourseErrorState from "../../components/courses/CourseErrorState";
import CoursePagination from "../../components/courses/CoursePagination";

/**
 * Trang danh sách khóa học public
 * Container chính, orchestrate các component con
 */
function CoursesPage() {
  const {
    categories,
    categoriesLoading,
    page,
    categoryFilter,
    searchQuery,
    handleSearch,
    handleCategoryClick,
    handlePageChange,
  } = useCourseFilters();

  const { courses, total, totalPages, loading, error, refetch } =
    usePublicCourses({ page, categoryFilter, searchQuery });

  const hasFilters = !!(categoryFilter || searchQuery);

  return (
    <div className="courses-page">
      {/* Hero + Search */}
      <CoursesHero searchQuery={searchQuery} onSearch={handleSearch} />

      <div className="container">
        <div className="courses-layout">
          {/* Sidebar - Category Filter */}
          <CourseCategoryFilter
            categories={categories}
            activeCategory={categoryFilter}
            onCategoryClick={handleCategoryClick}
            loading={categoriesLoading}
          />

          {/* Main Content */}
          <main className="courses-main">
            {/* Loading State */}
            {loading && <CourseSkeleton />}

            {/* Error State */}
            {!loading && error && (
              <CourseErrorState message={error} onRetry={refetch} />
            )}

            {/* Empty State */}
            {!loading && !error && courses.length === 0 && (
              <CourseEmptyState hasFilters={hasFilters} />
            )}

            {/* Course Grid */}
            {!loading && !error && courses.length > 0 && (
              <>
                <CourseGrid
                  courses={courses}
                  total={total}
                  displayedCount={courses.length}
                />
                <CoursePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CoursesPage;
