import Editor from "@/components/Editor"

const Home = () => {
	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-2xl font-bold mb-6">Writeflow</h1>
				<Editor />
			</div>
		</div>
	)
}

export default Home
