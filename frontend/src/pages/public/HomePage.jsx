import useHomePage from "../../hooks/home/useHomePage";
import HomeHero from "../../components/home/HomeHero";
import HomeSearchSection from "../../components/home/HomeSearchSection";
import HomeFeaturedCourses from "../../components/home/HomeFeaturedCourses";
import HomeCategories from "../../components/home/HomeCategories";
import HomeWhyUs from "../../components/home/HomeWhyUs";
import HomeCTA from "../../components/home/HomeCTA";

/**
 * HomePage - container chính của trang chủ.
 * Chỉ đóng vai trò orchestration: gọi hook lấy dữ liệu, render các section.
 * Không chứa logic API, không hard-code dữ liệu.
 */
function HomePage() {
  const { courses, categories, loading, error, retry } = useHomePage();

  return (
    <div className="home-page">
      <HomeHero />
      <HomeSearchSection />
      <HomeFeaturedCourses
        courses={courses}
        loading={loading}
        error={error}
        onRetry={retry}
      />
      <HomeCategories categories={categories} loading={loading} />
      <HomeWhyUs />
      <HomeCTA />
    </div>
  );
}

export default HomePage;
