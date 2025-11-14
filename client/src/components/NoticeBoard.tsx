
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Bell, Plus } from "lucide-react";

type Notice = {
  _id: string;
  title: string;
  description: string;
};

const NoticeBoard = () => {
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [formData, setFormData] = useState({ title: "", description: "" });

  const getAllNotices = () => {
    axios.get("https://bhartiyadharohar.in/api/website/notice/view").then((res) => {
      if (res.data.status === 1) {
        setNoticeList(res.data.noticeList);
      }
    });
  };

  const saveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    axios
      .post("https://bhartiyadharohar.in/api/website/notice/insert", formData)
      .then((res) => {
        if (res.data.status === 1) {
          getAllNotices();
          setFormData({ title: "", description: "" });
        }
      });
  };

  const deleteNotice = (id: string) => {
    axios
      .delete(`https://bhartiyadharohar.in/api/website/notice/delete/${id}`)
      .then((res) => {
        if (res.data.status === 1) getAllNotices();
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    getAllNotices();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-red-100">
      <Card className="rounded-3xl shadow-2xl bg-white/80 backdrop-blur-xl border-2 border-orange-200 max-w-[100%] mx-auto">
        <CardHeader className="flex flex-row items-center gap-4 pb-8 pt-8">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
            Notice Board
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          {noticeList.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-8 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-xl">
                <Bell className="h-16 w-16 text-orange-500" />
              </div>
              <p className="text-xl text-gray-600 font-semibold italic">No notices found</p>
              <p className="text-gray-500 mt-2">Add your first notice below</p>
            </div>
          ) : (
            noticeList.map((notice) => (
              <div
                key={notice._id}
                className="relative bg-gradient-to-br from-white/90 to-orange-50/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200 hover:border-orange-300 group"
              >
                <p className="text-xl font-bold text-orange-800 mb-3 pr-12">{notice.title}</p>
                <p className="text-base text-gray-700 leading-relaxed">{notice.description}</p>
                <button
                  onClick={() => deleteNotice(notice._id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-all duration-300 opacity-70 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </CardContent>

        <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/80 border-t-2 border-orange-200 p-8 space-y-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-orange-800">Add New Notice</h3>
          </div>
          <Input
            name="title"
            placeholder="Enter notice title..."
            value={formData.title}
            onChange={handleChange}
            className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
          />
          <Input
            name="description"
            placeholder="Enter notice description..."
            value={formData.description}
            onChange={handleChange}
            className="h-14 text-lg bg-white/90 backdrop-blur-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl shadow-lg transition-all duration-300 font-semibold"
          />
          <Button 
            onClick={saveNotice} 
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-2" />
            Save Notice
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NoticeBoard;
